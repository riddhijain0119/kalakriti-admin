import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { adminApi, publicApi } from "@/api";
import { StatusChip } from "@/components/StatusChip";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Search, Loader2, RefreshCw, PackageOpen } from "lucide-react";
import { toast } from "sonner";

const STATUSES = ["NEW", "PAYMENT_RECEIVED", "ASSIGNED", "IN_PROGRESS", "DRAFT_SHARED", "REVISIONS", "APPROVED", "PRINTING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"];

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [medium, setMedium] = useState("");
  const [mediums, setMediums] = useState([]);

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (status) params.status = status;
      if (medium) params.medium = medium;
      const res = await adminApi.listOrders(params);
      setOrders(res.items || []);
      setTotal(res.total || 0);
    } catch (e) {
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const m = await publicApi.mediums();
        setMediums(m);
      } catch {}
      load();
    })();
  }, []);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line
  }, [search, status, medium]);

  return (
    <AdminLayout
      title="Orders"
      subtitle={`${total} total ${total === 1 ? "order" : "orders"}`}
      actions={<Button variant="secondary" onClick={load} data-testid="orders-refresh-button"><RefreshCw size={14} className="mr-2"/>Refresh</Button>}
    >
      <div className="luxury-card overflow-hidden">
        <div className="p-4 flex flex-col md:flex-row md:items-center gap-3 border-b border-[hsl(var(--border))]">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
            <Input
              data-testid="orders-search-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search order #, email, or name"
              className="pl-9"
            />
          </div>
          <Select value={status || "all"} onValueChange={(v) => setStatus(v === "all" ? "" : v)}>
            <SelectTrigger className="md:w-[180px]" data-testid="orders-status-select"><SelectValue placeholder="All statuses" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {STATUSES.map((s) => <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={medium || "all"} onValueChange={(v) => setMedium(v === "all" ? "" : v)}>
            <SelectTrigger className="md:w-[180px]" data-testid="orders-medium-select"><SelectValue placeholder="All mediums" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All mediums</SelectItem>
              {mediums.map((m) => <SelectItem key={m.slug} value={m.slug}>{m.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-widest text-[hsl(var(--muted-foreground))] border-b border-[hsl(var(--border))]">
                <th className="px-5 py-3">Order</th>
                <th className="px-5 py-3">Customer</th>
                <th className="px-5 py-3">Medium</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Payment</th>
                <th className="px-5 py-3 text-right">Total</th>
                <th className="px-5 py-3 text-right">Placed</th>
              </tr>
            </thead>
            <tbody data-testid="orders-table-body">
              {loading ? (
                <tr><td colSpan="7" className="px-5 py-16 text-center"><Loader2 className="inline animate-spin text-[hsl(var(--muted-foreground))]" /></td></tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-5 py-16 text-center">
                    <PackageOpen size={40} className="mx-auto text-[hsl(var(--muted-foreground))]/60 mb-3" />
                    <div className="font-display text-xl font-semibold text-[hsl(var(--primary))]">No orders found</div>
                    <div className="text-sm text-[hsl(var(--muted-foreground))] mt-1">When a customer places an order, it will appear here with reference photos and status.</div>
                  </td>
                </tr>
              ) : (
                orders.map((o) => (
                  <tr key={o.id} className="border-b border-[hsl(var(--border))]/60 hover:bg-[rgba(44,24,16,0.025)] transition-colors">
                    <td className="px-5 py-3">
                      <Link to={`/orders/${o.id}`} data-testid={`order-row-${o.order_number}`} className="font-mono text-xs font-medium text-[hsl(var(--primary))] hover:text-[hsl(var(--accent))]">
                        {o.order_number}
                      </Link>
                      {o.rush && <span className="ml-2 text-[10px] uppercase tracking-wider text-[hsl(var(--warning))]">Rush</span>}
                    </td>
                    <td className="px-5 py-3">
                      <div className="font-medium truncate max-w-[200px]">{o.customer?.name}</div>
                      <div className="text-xs text-[hsl(var(--muted-foreground))] truncate max-w-[200px]">{o.customer?.email}</div>
                    </td>
                    <td className="px-5 py-3 capitalize">{o.medium_name}{o.size ? ` · ${o.size}` : ""}</td>
                    <td className="px-5 py-3"><StatusChip status={o.status} /></td>
                    <td className="px-5 py-3 text-xs font-medium">
                      {o.payment?.status === "PAID" ? <span className="text-[hsl(var(--success))]">Paid</span> : <span className="text-[hsl(var(--muted-foreground))]">{o.payment?.status || "PENDING"}</span>}
                    </td>
                    <td className="px-5 py-3 text-right font-mono tabular-nums">₹{Number(o.pricing?.total || 0).toLocaleString("en-IN")}</td>
                    <td className="px-5 py-3 text-right text-xs text-[hsl(var(--muted-foreground))]">
                      {o.created_at ? new Date(o.created_at).toLocaleDateString() : ""}
                    </td>
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
