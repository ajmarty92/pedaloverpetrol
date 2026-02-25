import type { ReactNode } from "react";
import { AuthGuard } from "@/components/auth-guard";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-100">
        <Sidebar />
        <div className="pl-64">
          <Topbar />
          <main className="p-6">{children}</main>
        </div>
      </div>
    </AuthGuard>
  );
}
