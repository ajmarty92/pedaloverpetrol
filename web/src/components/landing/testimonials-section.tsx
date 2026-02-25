import { Star } from "lucide-react";
import { copy } from "./site-copy";

const c = copy.testimonials;

export function TestimonialsSection() {
  return (
    <section className="border-b border-gray-100 bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-5">
        <h2 className="text-center text-3xl font-bold text-gray-900 sm:text-4xl">
          {c.heading}
        </h2>

        <div className="mt-14 grid gap-8 sm:grid-cols-3">
          {c.items.map((t) => (
            <div
              key={t.author}
              className="rounded-card border border-gray-200 bg-white p-6 shadow-card"
            >
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-brand text-brand" />
                ))}
              </div>
              <p className="mt-4 text-sm leading-relaxed text-gray-600">
                "{t.quote}"
              </p>
              <div className="mt-5 border-t border-gray-100 pt-4">
                <p className="text-sm font-semibold text-gray-900">{t.author}</p>
                <p className="text-xs text-gray-500">{t.company}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
