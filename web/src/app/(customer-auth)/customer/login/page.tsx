"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Package } from "lucide-react";
import { customerApi, CustomerApiError } from "@/lib/customer-api";
import { storeCustomerTokens, storeCustomerInfo } from "@/lib/customer-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import type { CustomerTokenResponse } from "@/types";

export default function CustomerLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await customerApi.post<CustomerTokenResponse>(
        "/api/customer/auth/login",
        { email, password },
      );
      storeCustomerTokens(data.access_token, data.refresh_token);
      storeCustomerInfo(data.customer_name, email);
      router.push("/customer/jobs");
    } catch (err) {
      if (err instanceof CustomerApiError) {
        setError(err.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-950 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand shadow-lg shadow-brand/25">
            <Package className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">PedalOverPetrol</h1>
          <p className="text-sm text-gray-400">Customer portal — sign in to view your deliveries</p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                id="email"
                label="Email"
                type="email"
                placeholder="you@yourcompany.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
              <Input
                id="password"
                label="Password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Signing in…
                  </span>
                ) : (
                  "Sign in"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-gray-500">
          Not a customer?{" "}
          <a href="/login" className="text-brand hover:underline">
            Admin login
          </a>
        </p>
      </div>
    </div>
  );
}
