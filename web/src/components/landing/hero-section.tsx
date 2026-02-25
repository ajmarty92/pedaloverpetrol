"use client";

import { Zap, MapPin, ShieldCheck, Building } from "lucide-react";
import { copy } from "./site-copy";

const iconMap: Record<string, typeof Zap> = {
  zap: Zap,
  "map-pin": MapPin,
  "shield-check": ShieldCheck,
  building: Building,
};

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

export function HeroSection() {
  return (
    <section className="relative flex min-h-[100dvh] items-center bg-shell pt-16">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(255,122,0,0.08)_0%,_transparent_60%)]" />

      <div className="relative mx-auto max-w-6xl px-5 py-24 sm:py-32">
        <div className="max-w-2xl">
          <h1 className="whitespace-pre-line text-4xl font-extrabold leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-6xl">
            {copy.tagline}
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-relaxed text-gray-400">
            {copy.subtitle}
          </p>

          <div className="mt-10 flex flex-wrap gap-4">
            <button
              onClick={() => scrollTo("quote")}
              className="inline-flex h-12 items-center gap-2 rounded-lg bg-brand px-7 text-base font-semibold text-white shadow-lg shadow-brand/25 transition-all hover:bg-brand-600 hover:shadow-brand/30 active:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-shell"
            >
              {copy.heroCta}
            </button>
            <button
              onClick={() => scrollTo("track")}
              className="inline-flex h-12 items-center gap-2 rounded-lg border border-white/20 px-7 text-base font-semibold text-white transition-all hover:border-white/40 hover:bg-white/5 active:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-shell"
            >
              {copy.heroSecondaryCta}
            </button>
          </div>

          <div className="mt-14 flex flex-wrap gap-x-8 gap-y-3">
            {copy.trustBadges.map((b) => {
              const Icon = iconMap[b.icon] ?? Zap;
              return (
                <div key={b.text} className="flex items-center gap-2 text-sm text-gray-500">
                  <Icon className="h-4 w-4 text-brand" />
                  <span>{b.text}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
