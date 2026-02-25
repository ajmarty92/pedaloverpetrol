"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  DollarSign,
  Plus,
  Pencil,
  Check,
  X,
  Calculator,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { api, ApiError } from "@/lib/api-client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import type { PricingRule, PriceQuoteResponse } from "@/types";

function RuleForm({
  initial,
  onSave,
  onCancel,
  saving,
}: {
  initial?: PricingRule;
  onSave: (data: Record<string, unknown>) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [name, setName] = useState(initial?.rule_name ?? "");
  const [base, setBase] = useState(String(initial?.base_rate ?? ""));
  const [mile, setMile] = useState(String(initial?.per_mile_rate ?? "0"));
  const [rush, setRush] = useState(String(initial?.rush_surcharge ?? "0"));
  const [heavy, setHeavy] = useState(String(initial?.heavy_surcharge ?? "0"));
  const [zone, setZone] = useState(
    initial?.zone_config ? JSON.stringify(initial.zone_config, null, 2) : "",
  );
  const [active, setActive] = useState(initial?.active ?? true);

  function handleSubmit() {
    let zoneConfig = null;
    if (zone.trim()) {
      try {
        zoneConfig = JSON.parse(zone);
      } catch {
        return;
      }
    }
    onSave({
      rule_name: name,
      base_rate: parseFloat(base),
      per_mile_rate: parseFloat(mile),
      rush_surcharge: parseFloat(rush),
      heavy_surcharge: parseFloat(heavy),
      zone_config: zoneConfig,
      active,
    });
  }

  return (
    <div className="space-y-4 rounded-lg border border-brand/30 bg-brand/5 p-5">
      <div className="grid grid-cols-2 gap-4">
        <Input id="rn" label="Rule name" value={name} onChange={(e) => setName(e.target.value)} />
        <div className="flex items-end gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-brand focus:ring-brand"
            />
            Active
          </label>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Input id="br" label="Base rate ($)" type="number" step="0.01" value={base} onChange={(e) => setBase(e.target.value)} />
        <Input id="mr" label="Per-mile ($)" type="number" step="0.01" value={mile} onChange={(e) => setMile(e.target.value)} />
        <Input id="rs" label="Rush surcharge ($)" type="number" step="0.01" value={rush} onChange={(e) => setRush(e.target.value)} />
        <Input id="hs" label="Heavy surcharge ($)" type="number" step="0.01" value={heavy} onChange={(e) => setHeavy(e.target.value)} />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">
          Zone config (JSON, optional)
        </label>
        <textarea
          value={zone}
          onChange={(e) => setZone(e.target.value)}
          rows={3}
          placeholder='{"zones": {"zone_a": 1.0, "zone_b": 1.5}}'
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 font-mono text-xs text-gray-700 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/50"
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onCancel} disabled={saving}>
          <X className="h-3.5 w-3.5" /> Cancel
        </Button>
        <Button size="sm" onClick={handleSubmit} disabled={saving}>
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
          {initial ? "Update" : "Create"}
        </Button>
      </div>
    </div>
  );
}

export default function PricingSettingsPage() {
  const qc = useQueryClient();
  const [editId, setEditId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [quoteResult, setQuoteResult] = useState<PriceQuoteResponse | null>(null);

  const [qDist, setQDist] = useState("5");
  const [qRush, setQRush] = useState(false);
  const [qHeavy, setQHeavy] = useState(false);

  const { data: rules, isLoading } = useQuery<PricingRule[]>({
    queryKey: ["pricing-rules"],
    queryFn: () => api.get("/api/pricing/rules"),
  });

  const createMut = useMutation({
    mutationFn: (data: Record<string, unknown>) => api.post("/api/pricing/rules", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pricing-rules"] });
      setCreating(false);
    },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      api.patch(`/api/pricing/rules/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pricing-rules"] });
      setEditId(null);
    },
  });

  async function runQuote() {
    try {
      const res = await api.post<PriceQuoteResponse>("/api/pricing/quote", {
        distance_miles: parseFloat(qDist),
        is_rush: qRush,
        is_heavy: qHeavy,
      });
      setQuoteResult(res);
    } catch {
      setQuoteResult(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pricing Rules</h1>
          <p className="text-sm text-gray-500">Configure delivery pricing, surcharges, and zone multipliers.</p>
        </div>
        {!creating && (
          <Button onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" /> New Rule
          </Button>
        )}
      </div>

      {creating && (
        <RuleForm
          onSave={(data) => createMut.mutate(data)}
          onCancel={() => setCreating(false)}
          saving={createMut.isPending}
        />
      )}

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="px-5 py-3 text-left font-semibold text-gray-600">Rule</th>
                <th className="px-5 py-3 text-right font-semibold text-gray-600">Base</th>
                <th className="px-5 py-3 text-right font-semibold text-gray-600">Per Mile</th>
                <th className="px-5 py-3 text-right font-semibold text-gray-600">Rush</th>
                <th className="px-5 py-3 text-right font-semibold text-gray-600">Heavy</th>
                <th className="px-5 py-3 text-center font-semibold text-gray-600">Zones</th>
                <th className="px-5 py-3 text-center font-semibold text-gray-600">Active</th>
                <th className="px-5 py-3 text-right font-semibold text-gray-600"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading && (
                <tr><td colSpan={8} className="p-4"><Skeleton className="h-10 w-full" /></td></tr>
              )}

              {rules?.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-400">
                    No pricing rules configured yet.
                  </td>
                </tr>
              )}

              {rules?.map((rule) =>
                editId === rule.id ? (
                  <tr key={rule.id}>
                    <td colSpan={8} className="p-4">
                      <RuleForm
                        initial={rule}
                        onSave={(data) => updateMut.mutate({ id: rule.id, data })}
                        onCancel={() => setEditId(null)}
                        saving={updateMut.isPending}
                      />
                    </td>
                  </tr>
                ) : (
                  <tr key={rule.id} className="hover:bg-gray-50/50">
                    <td className="px-5 py-3 font-medium text-gray-900">{rule.rule_name}</td>
                    <td className="px-5 py-3 text-right tabular-nums">${rule.base_rate.toFixed(2)}</td>
                    <td className="px-5 py-3 text-right tabular-nums">${rule.per_mile_rate.toFixed(2)}</td>
                    <td className="px-5 py-3 text-right tabular-nums">
                      {rule.rush_surcharge > 0 ? `$${rule.rush_surcharge.toFixed(2)}` : "—"}
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums">
                      {rule.heavy_surcharge > 0 ? `$${rule.heavy_surcharge.toFixed(2)}` : "—"}
                    </td>
                    <td className="px-5 py-3 text-center">
                      {rule.zone_config ? (
                        <span className="rounded bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                          {Object.keys(rule.zone_config.zones ?? rule.zone_config).length} zones
                        </span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-center">
                      {rule.active ? (
                        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-green-100 text-green-600">
                          <Check className="h-3 w-3" />
                        </span>
                      ) : (
                        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-gray-100 text-gray-400">
                          <X className="h-3 w-3" />
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Button variant="ghost" size="sm" onClick={() => setEditId(rule.id)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Price calculator */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-brand" />
            <h2 className="text-sm font-semibold text-gray-700">Price Calculator</h2>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-4">
            <div className="w-32">
              <Input
                id="calc-dist" label="Distance (mi)" type="number" step="0.1"
                value={qDist} onChange={(e) => setQDist(e.target.value)}
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={qRush} onChange={(e) => setQRush(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-brand focus:ring-brand" />
              Rush
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={qHeavy} onChange={(e) => setQHeavy(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-brand focus:ring-brand" />
              Heavy
            </label>
            <Button size="sm" onClick={runQuote}>
              <Calculator className="h-3.5 w-3.5" /> Calculate
            </Button>
          </div>

          {quoteResult && (
            <div className="mt-4 rounded-lg bg-gray-50 p-4">
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-gray-500">Using: {quoteResult.rule_name}</span>
                <span className="text-2xl font-bold text-gray-900">${quoteResult.total.toFixed(2)}</span>
              </div>
              <p className="mt-2 font-mono text-xs text-gray-500">{quoteResult.breakdown}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
