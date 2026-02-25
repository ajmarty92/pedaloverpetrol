"use client";

import { Package, Truck, Users, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const stats = [
  { label: "Active Jobs", value: "—", icon: Package, color: "text-brand" },
  { label: "Drivers On Duty", value: "—", icon: Truck, color: "text-green-600" },
  { label: "Customers", value: "—", icon: Users, color: "text-blue-600" },
  { label: "Deliveries Today", value: "—", icon: TrendingUp, color: "text-purple-600" },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500">Welcome to the PedalOverPetrol admin panel.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-center gap-4 py-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-50">
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-gray-400">
            Dashboard analytics will be wired up in the next iteration.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
