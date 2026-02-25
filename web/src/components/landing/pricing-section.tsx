"use client";

import { copy } from "./site-copy";

const c = copy.pricing;

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

export function PricingSection() {
  return (
    <section id="pricing" className="bg-gray-50 py-20 sm:py-28">
      <div className="mx-auto max-w-3xl px-5 text-center">
        <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">{c.heading}</h2>
        <p className="mt-3 text-gray-500">{c.subtitle}</p>

        <div className="mx-auto mt-12 max-w-md rounded-card border border-gray-200 bg-white p-8 shadow-card">
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-sm text-gray-500">From</span>
            <span className="text-5xl font-extrabold text-gray-900">${c.startingAt}</span>
          </div>
          <p className="mt-2 text-sm text-gray-500">
            + ${c.perMile} per mile
          </p>

          <ul className="mt-6 space-y-3 text-left text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-brand">✓</span>
              Same-day delivery included
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-brand">✓</span>
              Real-time tracking link
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-brand">✓</span>
              Photo proof of delivery
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-brand">✓</span>
              Rush and heavy item surcharges quoted upfront
            </li>
          </ul>

          <button
            onClick={() => scrollTo("quote")}
            className="mt-8 inline-flex h-11 w-full items-center justify-center rounded-lg bg-brand text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-600 active:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
          >
            Get Your Quote
          </button>

          <p className="mt-4 text-xs text-gray-400">{c.note}</p>
        </div>
      </div>
    </section>
  );
}
