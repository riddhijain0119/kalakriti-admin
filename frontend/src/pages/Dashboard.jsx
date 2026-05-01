import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { adminApi } from "@/api";
import { StatusChip } from "@/components/StatusChip";
import { ShoppingBag, IndianRupee, Truck, Calendar, ArrowUpRight, Loader2 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, PieChart, Pie, Cell, Legend } from "recharts";
import { toast } from "sonner";

const PALETTE = ["#2C1810", "#C9A84C", "#9C8878", "#2F6B4F", "#2B6F7A"];

const StatCard = ({ icon: Icon, label, value, sub, testid }) => (
  <div data-testid={testid} className="luxury-card p-5">
    <div className="flex items-start justify-between gap-3">
      <div className="section-label">{label}</div>
      <div className="w-8 h-8 rounded-md bg-[hsl(var(--secondary))] text-[hsl(var(--primary))] flex items-center justify-center">
        <Icon size={16} />
      </div>
    </div>
    <div className="mt-3 kpi-number text-3xl text-[hsl(var(--primary))]">{value}</div>
    {sub && <div className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">{sub}</div>}
  </div>
);

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [ts, setTs] = useState([]);
  const [byMedium, setByMedium] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [s, t, m] = await Promise.all([
          adminApi.dashboardStats(),
          adminApi.revenueTimeseries(30),
          adminApi.ordersByMedium(),
        ]);
        setStats(s);
        setTs(t);
        setByMedium(m);
      } catch (e) {
        toast.error("Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <AdminLayout title="Dashboard">
        <div className="flex items-center justify-center py-32">
          <Loader2 className="animate-spin text-[hsl(var(--muted-foreground))]" />
        </div>
      </AdminLayout>
    );
  }

  const fmt = (n) => "₹" + Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 });

  return (
    <AdminLayout
      title="Dashboard"
      subtitle="An overview of your commissions, revenue, and pending shipments."
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4" data-testid="dashboard-stat-cards">
        <StatCard icon={ShoppingBag} label="Today's Orders" value={stats?.today_orders || 0} sub={`${stats?.total_orders || 0} lifetime`} testid="stat-today-orders" />
        <StatCard icon={IndianRupee} label="Revenue Today" value={fmt(stats?.revenue_today)} sub="Paid orders" testid="stat-revenue-today" />
        <StatCard icon={Calendar} label="Revenue MTD" value={fmt(stats?.revenue_mtd)} sub="Month to date" testid="stat-revenue-mtd" />
        <StatCard icon={Truck} label="Pending Shipments" value={stats?.pending_shipments || 0} sub="Ready to ship" testid="stat-pending-shipments" />
      </div>

      <div className="mt-6 grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Revenue chart */}
        <div className="luxury-card p-5 xl:col-span-2" data-testid="dashboard-revenue-chart">
          <div className="flex items-center justify-between mb-1">
            <div>
              <div className="section-label">Revenue · Last 30 days</div>
              <div className="font-display text-2xl font-semibold text-[hsl(var(--primary))] mt-1">
                {fmt(ts.reduce((a, x) => a + (x.revenue || 0), 0))}
              </div>
            </div>
          </div>
          <div className="h-60 -mx-2 mt-3">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={ts} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#C9A84C" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#C9A84C" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(44,24,16,0.08)" />
                <XAxis dataKey="date" tick={{ fill: "rgba(61,53,48,0.6)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "rgba(61,53,48,0.6)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "#FAF6F0", border: "1px solid rgba(44,24,16,0.14)", borderRadius: 8, fontSize: 12 }} />
                <Area type="monotone" dataKey="revenue" stroke="#2C1810" strokeWidth={2} fillOpacity={1} fill="url(#rev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Orders by medium */}
        <div className="luxury-card p-5" data-testid="dashboard-by-medium-chart">
          <div className="section-label">Orders by medium</div>
          <div className="h-60 mt-3">
            {byMedium.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-[hsl(var(--muted-foreground))]">
                No data yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={byMedium} dataKey="count" nameKey="medium_slug" outerRadius={70} innerRadius={40} paddingAngle={2}>
                    {byMedium.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "#FAF6F0", border: "1px solid rgba(44,24,16,0.14)", borderRadius: 8, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Recent orders */}
      <div className="mt-6 luxury-card overflow-hidden" data-testid="dashboard-recent-orders">
        <div className="flex items-center justify-between p-5 pb-3">
          <div>
            <div className="section-label">Recent orders</div>
            <h3 className="font-display text-xl font-semibold text-[hsl(var(--primary))] mt-1">Latest activity</h3>
          </div>
          <Link to="/orders" className="text-xs font-medium text-[hsl(var(--primary))] hover:text-[hsl(var(--accent))] flex items-center gap-1">
            View all <ArrowUpRight size={14} />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-widest text-[hsl(var(--muted-foreground))] border-t border-b border-[hsl(var(--border))]">
                <th className="px-5 py-3">Order</th>
                <th className="px-5 py-3">Customer</th>
                <th className="px-5 py-3">Medium</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {(stats?.recent_orders || []).length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-5 py-8 text-center text-[hsl(var(--muted-foreground))]">
                    No orders yet. Orders placed on kalakritishop.in will appear here.
                  </td>
                </tr>
              ) : (
                stats.recent_orders.map((o) => (
                  <tr key={o.id} className="border-b border-[hsl(var(--border))]/60 hover:bg-[rgba(44,24,16,0.025)] transition-colors">
                    <td className="px-5 py-3">
                      <Link to={`/orders/${o.id}`} className="font-mono text-xs font-medium text-[hsl(var(--primary))] hover:text-[hsl(var(--accent))]">
                        {o.order_number}
                      </Link>
                    </td>
                    <td className="px-5 py-3">
                      <div className="font-medium">{o.customer?.name}</div>
                      <div className="text-xs text-[hsl(var(--muted-foreground))]">{o.customer?.email}</div>
                    </td>
                    <td className="px-5 py-3 capitalize">{o.medium_name}</td>
                    <td className="px-5 py-3"><StatusChip status={o.status} /></td>
                    <td className="px-5 py-3 text-right font-mono tabular-nums">₹{Number(o.pricing?.total || 0).toLocaleString("en-IN")}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
