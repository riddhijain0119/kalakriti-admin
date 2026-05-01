import React from "react";
import { Sidebar } from "./Sidebar";
import { Toaster } from "@/components/ui/sonner";

export const AdminLayout = ({ children, title, subtitle, actions }) => {
  return (
    <div className="min-h-screen flex bg-[hsl(var(--background))] noise-bg">
      <Sidebar />
      <main className="flex-1 min-w-0">
        <div className="max-w-[1400px] mx-auto px-5 sm:px-7 py-7 relative z-10">
          {(title || actions) && (
            <div className="flex items-start justify-between gap-4 mb-7">
              <div>
                {title && (
                  <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-[hsl(var(--primary))]">
                    {title}
                  </h1>
                )}
                {subtitle && (
                  <p className="mt-1.5 text-sm text-[hsl(var(--muted-foreground))] max-w-2xl">
                    {subtitle}
                  </p>
                )}
              </div>
              {actions && <div className="flex items-center gap-2">{actions}</div>}
            </div>
          )}
          {children}
        </div>
      </main>
      <Toaster position="top-right" richColors />
    </div>
  );
};
