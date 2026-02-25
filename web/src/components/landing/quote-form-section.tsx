"use client";

import { useState, type FormEvent } from "react";
import { Send, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function QuoteFormSection() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const data = Object.fromEntries(form.entries());
    console.log("[Quote request]", data);
    await new Promise((r) => setTimeout(r, 800));
    setLoading(false);
    setSubmitted(true);
  }

  return (
    <section id="quote" className="border-b border-gray-100 bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-2xl px-5">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            Get a Free Quote
          </h2>
          <p className="mt-3 text-gray-500">
            Tell us where you're sending and we'll give you an instant estimate.
          </p>
        </div>

        {submitted ? (
          <div className="mt-12 flex flex-col items-center gap-4 rounded-card border border-green-200 bg-green-50 p-10 text-center">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Quote request received!
            </h3>
            <p className="text-sm text-gray-500">
              We'll get back to you shortly with a price. Check your email.
            </p>
            <Button variant="outline" size="sm" onClick={() => setSubmitted(false)}>
              Submit another
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-12 space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <Input
                id="pickup"
                name="pickup_address"
                label="Pickup address"
                placeholder="e.g. 15 Clerkenwell Rd, EC1M 5RD"
                required
              />
              <Input
                id="dropoff"
                name="dropoff_address"
                label="Drop-off address"
                placeholder="e.g. 42 Shoreditch High St, E1 6JE"
                required
              />
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <Input
                id="email"
                name="email"
                label="Email"
                type="email"
                placeholder="you@company.com"
                required
              />
              <Input
                id="phone"
                name="phone"
                label="Phone"
                type="tel"
                placeholder="+44 7700 000000"
              />
            </div>
            <div>
              <label htmlFor="notes" className="mb-1.5 block text-sm font-medium text-gray-900">
                Package notes (optional)
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={3}
                placeholder="Size, weight, fragile items, time preference…"
                className="flex w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 transition-shadow focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-1 focus:border-brand"
              />
            </div>
            <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Sending…
                </span>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Request Quote
                </>
              )}
            </Button>
          </form>
        )}
      </div>
    </section>
  );
}
