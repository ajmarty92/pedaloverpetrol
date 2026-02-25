"use client";

import Link from "next/link";
import { Package, Menu, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { copy } from "./site-copy";

const links = [
  { href: "#how-it-works", label: "How It Works" },
  { href: "#features", label: "Features" },
  { href: "#pricing", label: "Pricing" },
  { href: "#quote", label: "Get a Quote" },
];

const authLinks = [
  { href: "/tracking/demo", label: "Track" },
  { href: "/customer/login", label: "Customer Login" },
  { href: "/login", label: "Admin" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-shell/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand">
            <Package className="h-4 w-4 text-white" />
          </div>
          <span className="text-base font-bold text-white">{copy.brand}</span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="rounded-md px-3 py-2 text-sm text-gray-400 transition-colors hover:text-white"
            >
              {l.label}
            </a>
          ))}
          <div className="ml-4 flex items-center gap-2 border-l border-white/10 pl-4">
            {authLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="rounded-md px-3 py-1.5 text-xs font-medium text-gray-400 transition-colors hover:text-white"
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>

        <button
          className="rounded-md p-2 text-gray-400 md:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-white/10 bg-shell px-5 pb-4 pt-2 md:hidden">
          {[...links, ...authLinks].map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block rounded-md px-3 py-2.5 text-sm text-gray-300 transition-colors hover:text-white"
            >
              {l.label}
            </a>
          ))}
        </div>
      )}
    </nav>
  );
}
