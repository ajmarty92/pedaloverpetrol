"use client";

import { useRouter } from "next/navigation";
import { LogOut, User } from "lucide-react";
import { clearAuth, getUserEmail } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export function Topbar() {
  const router = useRouter();
  const email = getUserEmail();

  function handleLogout() {
    clearAuth();
    router.push("/login");
  }

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-end border-b border-white/10 bg-shell px-6">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <User className="h-4 w-4" />
          <span className="hidden sm:inline">{email ?? "Admin"}</span>
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
    </header>
  );
}
