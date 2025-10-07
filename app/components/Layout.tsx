import { Outlet } from "react-router";
import * as React from "react";

interface LayoutProps {
  user: {
    email?: string;
    user_metadata?: {
      full_name?: string;
    };
  };
  children?: React.ReactNode;
}

export default function Layout({ user, children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-custom-bg-dark">
      {/* Main Content - LAYOUT SIMPLIFICADO SIN SIDEBAR NI MENÚ MÓVIL */}
      <div className="flex flex-col">
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
