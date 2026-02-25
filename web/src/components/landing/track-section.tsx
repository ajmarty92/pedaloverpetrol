"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

export function TrackSection() {
  const router = useRouter();
  const [trackingId, setTrackingId] = useState("");

  function handleTrack(e: FormEvent) {
    e.preventDefault();
    const id = trackingId.trim();
    if (id) {
      router.push(`/tracking/${encodeURIComponent(id)}`);
    }
  }

  return (
    <section id="track" className="bg-shell py-20 sm:py-28">
      <div className="mx-auto max-w-xl px-5 text-center">
        <h2 className="text-3xl font-bold text-white sm:text-4xl">
          Track Your Delivery
        </h2>
        <p className="mt-3 text-gray-400">
          Enter your tracking ID to see real-time delivery status.
        </p>

        <form onSubmit={handleTrack} className="mt-10 flex gap-3">
          <input
            type="text"
            value={trackingId}
            onChange={(e) => setTrackingId(e.target.value.toUpperCase())}
            placeholder="e.g. A3K9F2XB7Q1P"
            maxLength={20}
            className="h-12 flex-1 rounded-lg border border-white/20 bg-white/5 px-4 text-sm font-medium tracking-wider text-white placeholder:text-gray-500 transition-shadow focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
          />
          <button
            type="submit"
            disabled={!trackingId.trim()}
            className="inline-flex h-12 items-center gap-2 rounded-lg bg-brand px-6 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-600 active:bg-brand-700 disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-shell"
          >
            <Search className="h-4 w-4" />
            Track
          </button>
        </form>
      </div>
    </section>
  );
}
