import {
  MapPin,
  Camera,
  BarChart3,
  CreditCard,
  Route,
  Users,
} from "lucide-react";
import { copy } from "./site-copy";

const iconMap: Record<string, typeof MapPin> = {
  "map-pin": MapPin,
  camera: Camera,
  "bar-chart-3": BarChart3,
  "credit-card": CreditCard,
  route: Route,
  users: Users,
};

const c = copy.features;

export function FeaturesSection() {
  return (
    <section id="features" className="bg-gray-50 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-5">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">{c.heading}</h2>
          <p className="mx-auto mt-3 max-w-lg text-gray-500">{c.subtitle}</p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {c.items.map((f) => {
            const Icon = iconMap[f.icon] ?? MapPin;
            return (
              <div
                key={f.title}
                className="rounded-card border border-gray-200 bg-white p-6 shadow-card transition-shadow hover:shadow-md"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand/10">
                  <Icon className="h-5 w-5 text-brand" />
                </div>
                <h3 className="mt-4 text-base font-semibold text-gray-900">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">
                  {f.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
