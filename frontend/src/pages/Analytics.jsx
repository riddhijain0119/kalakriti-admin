import React, { useEffect, useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { adminApi } from "@/api";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, Legend, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const PALETTE = ["#2C1810", "#C9A84C", "#9C8878", "#2F6B4F", "#2B6F7A", "#C77C2E"];

export default function AnalyticsPage() {
  const [ts, setTs] = useState([]);
  const [byStatus, setByStatus] = useState([]);
  const [byMedium, setByMedium] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [a, b, c] = await Promise.all([
          adminApi.revenueTimeseries(90),
          adminApi.ordersByStatus(),
          adminApi.ordersByMedium(),
        ]);
        setTs(a); setByStatus(b); setByMedium(c);
      } catch { toast.error("Failed"); }
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <AdminLayout title="Analytics"><div className="py-16 text-center"><Loader2 className="inline animate-spin"/></div></AdminLayout>;

  return (
    <AdminLayout title="Analytics" subtitle="Revenue trends, order pipeline, and medium performance.">
      <div className="grid grid-cols-1 gap-5">
        <div className="luxury-card p-5" data-testid="analytics-revenue-chart">
          <div className="section-label mb-4">Revenue · Last 90 days</div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={ts}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(44,24,16,0.08)"/>
                <XAxis dataKey="date" tick={{ fill: "rgba(61,53,48,0.6)", fontSize: 11 }} axisLine={false}/>
                <YAxis tick={{ fill: "rgba(61,53,48,0.6)", fontSize: 11 }} axisLine={false}/>
                <Tooltip contentStyle={{ background: "#FAF6F0", border: "1px solid rgba(44,24,16,0.14)", borderRadius: 8, fontSize: 12 }}/>
                <Line type="monotone" dataKey="revenue" stroke="#C9A84C" strokeWidth={2} dot={{ r: 3 }}/>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="luxury-card p-5" data-testid="analytics-status-chart">
            <div className="section-label mb-4">Orders by status</div>
            <div className="h-64">
              {byStatus.length === 0 ? <div className="h-full flex items-center justify-center text-sm text-[hsl(var(--muted-foreground))]">No orders yet</div> : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={byStatus}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(44,24,16,0.08)"/>
                    <XAxis dataKey="status" tick={{ fill: "rgba(61,53,48,0.6)", fontSize: 10 }} angle={-20} textAnchor="end" height={60}/>
                    <YAxis tick={{ fill: "rgba(61,53,48,0.6)", fontSize: 11 }}/>
                    <Tooltip contentStyle={{ background: "#FAF6F0", border: "1px solid rgba(44,24,16,0.14)", borderRadius: 8, fontSize: 12 }}/>
                    <Bar dataKey="count" fill="#2C1810" radius={[4,4,0,0]}/>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="luxury-card p-5" data-testid="analytics-medium-chart">
            <div className="section-label mb-4">Revenue by medium</div>
            <div className="h-64">
              {byMedium.length === 0 ? <div className="h-full flex items-center justify-center text-sm text-[hsl(var(--muted-foreground))]">No orders yet</div> : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={byMedium} dataKey="revenue" nameKey="medium_slug" outerRadius={80} innerRadius={45}>
                      {byMedium.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]}/>)}
                    </Pie>
                    <Tooltip contentStyle={{ background: "#FAF6F0", border: "1px solid rgba(44,24,16,0.14)", borderRadius: 8, fontSize: 12 }} formatter={(v) => "₹" + Number(v).toLocaleString("en-IN")}/>
                    <Legend wrapperStyle={{ fontSize: 11 }}/>
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
