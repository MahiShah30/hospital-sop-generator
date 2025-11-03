"use client";

import Dashboard from "../../../src/Dashboard";
import AuthGuard from "../../../src/components/AuthGuard";

export default function DashboardPage() {
  return (
    <AuthGuard>
      <Dashboard />
    </AuthGuard>
  );
}


