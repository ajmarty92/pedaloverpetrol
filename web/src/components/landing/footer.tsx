import Link from "next/link";
import { Package } from "lucide-react";
import { copy } from "./site-copy";

const columns = [
  {
    title: "Product",
    links: [
      { label: "How It Works", href: "#how-it-works" },
      { label: "Features", href: "#features" },
      { label: "Pricing", href: "#pricing" },
      { label: "Get a Quote", href: "#quote" },
    ],
  },
  {
    title: "Portals",
    links: [
      { label: "Admin Dashboard", href: "/login" },
      { label: "Customer Portal", href: "/customer/login" },
      { label: "Track a Delivery", href: "#track" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "#" },
      { label: "Contact", href: "#quote" },
      { label: "Privacy Policy", href: "#" },
      { label: "Terms of Service", href: "#" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-shell">
      <div className="mx-auto max-w-6xl px-5 py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand">
                <Package className="h-4 w-4 text-white" />
              </div>
              <span className="text-base font-bold text-white">{copy.brand}</span>
            </div>
            <p className="mt-3 text-sm text-gray-500">{copy.footer.tagline}</p>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                {col.title}
              </h3>
              <ul className="mt-3 space-y-2">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-gray-400 transition-colors hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 border-t border-white/10 pt-6">
          <p className="text-center text-xs text-gray-600">{copy.footer.copyright}</p>
        </div>
      </div>
    </footer>
  );
}
