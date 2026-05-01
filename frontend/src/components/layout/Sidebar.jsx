import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  ShoppingBag,
  Palette,
  Images,
  MessageSquareQuote,
  FileText,
  Ticket,
  Settings as SettingsIcon,
  BarChart3,
  LogOut,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const groups = [
  {
    label: "Overview",
    items: [
      { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard", testid: "nav-dashboard" },
      { to: "/analytics", icon: BarChart3, label: "Analytics", testid: "nav-analytics" },
    ],
  },
  {
    label: "Commerce",
    items: [
      { to: "/orders", icon: ShoppingBag, label: "Orders", testid: "nav-orders" },
      { to: "/mediums", icon: Palette, label: "Mediums", testid: "nav-mediums" },
      { to: "/coupons", icon: Ticket, label: "Coupons", testid: "nav-coupons" },
    ],
  },
  {
    label: "Content",
    items: [
      { to: "/gallery", icon: Images, label: "Gallery", testid: "nav-gallery" },
      { to: "/testimonials", icon: MessageSquareQuote, label: "Testimonials", testid: "nav-testimonials" },
      { to: "/content", icon: FileText, label: "Homepage CMS", testid: "nav-content" },
    ],
  },
  {
    label: "System",
    items: [
      { to: "/settings", icon: SettingsIcon, label: "Settings", testid: "nav-settings" },
    ],
  },
];

export const Sidebar = () => {
  const location = useLocation();
  const { admin, logout } = useAuth();

  return (
    <aside className="hidden lg:flex flex-col w-[260px] shrink-0 h-screen sticky top-0 border-r border-[hsl(var(--border))] bg-[hsl(var(--card))]/70 backdrop-blur-sm">
      <div className="h-16 flex items-center gap-2 px-5 border-b border-[hsl(var(--border))]">
        <div className="w-8 h-8 rounded-md bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] flex items-center justify-center">
          <Sparkles size={15} />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="font-display text-lg font-semibold text-[hsl(var(--primary))]">Kalakriti</span>
          <span className="text-[10px] tracking-widest uppercase text-[hsl(var(--muted-foreground))]">Admin Studio</span>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {groups.map((g) => (
          <div key={g.label}>
            <div className="px-3 pb-2 text-[10px] tracking-widest uppercase text-[hsl(var(--muted-foreground))] font-medium">
              {g.label}
            </div>
            <div className="space-y-0.5">
              {g.items.map((it) => {
                const active =
                  location.pathname === it.to || location.pathname.startsWith(it.to + "/");
                const Icon = it.icon;
                return (
                  <Link
                    key={it.to}
                    to={it.to}
                    data-testid={it.testid}
                    className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                      active
                        ? "bg-[rgba(156,136,120,0.16)] text-[hsl(var(--primary))] border-l-2 border-[hsl(var(--accent))] pl-[10px] font-medium"
                        : "text-[hsl(var(--primary))]/80 hover:bg-[rgba(44,24,16,0.05)]"
                    }`}
                  >
                    <Icon size={16} />
                    <span>{it.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
      <div className="p-3 border-t border-[hsl(var(--border))]">
        <div className="flex items-center gap-3 px-2 py-2 rounded-md bg-[hsl(var(--secondary))]">
          <div className="w-8 h-8 rounded-full bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] flex items-center justify-center text-xs font-semibold">
            {(admin?.email?.[0] || "A").toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium truncate">{admin?.email}</div>
            <div className="text-[10px] text-[hsl(var(--muted-foreground))] capitalize">{admin?.role || "owner"}</div>
          </div>
          <button
            onClick={logout}
            data-testid="sidebar-logout-button"
            className="p-1.5 rounded hover:bg-[rgba(44,24,16,0.08)] transition-colors"
            title="Log out"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  );
};
