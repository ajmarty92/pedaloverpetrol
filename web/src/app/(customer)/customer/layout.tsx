"use client";

import { useRouter } from "next/navigation";
import { Package, LogOut, User } from "lucide-react";
import { CustomerAuthGuard } from "@/components/customer-auth-guard";
import { clearCustomerAuth, getCustomerName } from "@/lib/customer-auth";
import { Button } from "@/components/ui/button";
import type { ReactNode } from "react";

export default function CustomerLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const name = getCustomerName();

  function handleLogout() {
    clearCustomerAuth();
    router.push("/customer/login");
  }

  return (
    <CustomerAuthGuard>
      <div className="min-h-screen bg-gray-50">
        {/* Top bar */}
        <header className="sticky top-0 z-20 border-b border-gray-200 bg-gray-950">
          <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand">
                <Package className="h-4 w-4 text-white" />
              </div>
              <span className="text-base font-bold text-white">PedalOverPetrol</span>
              <span className="hidden rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-medium text-gray-300 sm:inline">
                Customer Portal
              </span>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">{name ?? "Customer"}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-gray-400 hover:text-white hover:bg-white/10"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
          {children}
        </main>
      </div>
    </CustomerAuthGuard>
  );
}
