import { copy } from "./site-copy";

const c = copy.howItWorks;

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="border-b border-gray-100 bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-5">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">{c.heading}</h2>
          <p className="mx-auto mt-3 max-w-lg text-gray-500">{c.subtitle}</p>
        </div>

        <div className="mt-16 grid gap-8 sm:grid-cols-3">
          {c.steps.map((step) => (
            <div key={step.number} className="relative text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand/10 text-xl font-bold text-brand">
                {step.number}
              </div>
              <h3 className="mt-5 text-lg font-semibold text-gray-900">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-500">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
