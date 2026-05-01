import React, { useEffect, useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { adminApi } from "@/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Trash2, Loader2, Ticket } from "lucide-react";

export default function CouponsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ code: "", type: "percentage", value: 10, min_order: 0, max_uses: 100, active: true, description: "" });

  const load = async () => {
    try { setItems(await adminApi.listCoupons()); }
    catch { toast.error("Failed"); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!form.code) return toast.error("Code required");
    try { await adminApi.createCoupon({ ...form, code: form.code.toUpperCase() }); toast.success("Coupon created"); setOpen(false); setForm({ code: "", type: "percentage", value: 10, min_order: 0, max_uses: 100, active: true, description: "" }); load(); }
    catch (e) { toast.error(e?.response?.data?.detail || "Failed"); }
  };

  const toggleActive = async (c) => {
    try { await adminApi.updateCoupon(c.id, { active: !c.active }); load(); }
    catch { toast.error("Failed"); }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete coupon?")) return;
    try { await adminApi.deleteCoupon(id); toast.success("Deleted"); load(); }
    catch { toast.error("Failed"); }
  };

  return (
    <AdminLayout
      title="Coupons"
      subtitle="Create discount codes for seasonal offers or returning customers."
      actions={<Button onClick={() => setOpen(true)} data-testid="coupon-add-button"><Plus size={14} className="mr-2"/>Create coupon</Button>}
    >
      {loading ? <div className="py-16 text-center"><Loader2 className="inline animate-spin"/></div> : items.length === 0 ? (
        <div className="luxury-card p-16 text-center">
          <Ticket className="mx-auto text-[hsl(var(--muted-foreground))]/60 mb-4" size={40}/>
          <h3 className="font-display text-xl font-semibold">No coupons created</h3>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1 mb-4">Create a code for seasonal offers or returning customers.</p>
          <Button onClick={() => setOpen(true)}>Create coupon</Button>
        </div>
      ) : (
        <div className="luxury-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-widest text-[hsl(var(--muted-foreground))] border-b border-[hsl(var(--border))]">
                <th className="px-5 py-3">Code</th>
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3 text-right">Value</th>
                <th className="px-5 py-3 text-right">Min order</th>
                <th className="px-5 py-3 text-right">Used</th>
                <th className="px-5 py-3">Active</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((c) => (
                <tr key={c.id} className="border-b border-[hsl(var(--border))]/60 hover:bg-[rgba(44,24,16,0.025)]">
                  <td className="px-5 py-3 font-mono font-medium">{c.code}</td>
                  <td className="px-5 py-3 capitalize text-xs">{c.type}</td>
                  <td className="px-5 py-3 text-right font-mono">{c.type === "percentage" ? `${c.value}%` : `₹${c.value}`}</td>
                  <td className="px-5 py-3 text-right font-mono">₹{Number(c.min_order).toLocaleString("en-IN")}</td>
                  <td className="px-5 py-3 text-right text-xs text-[hsl(var(--muted-foreground))]">{c.used_count}/{c.max_uses}</td>
                  <td className="px-5 py-3"><Switch checked={c.active} onCheckedChange={() => toggleActive(c)}/></td>
                  <td className="px-5 py-3"><Button size="icon" variant="ghost" onClick={() => remove(c.id)} className="text-[hsl(var(--destructive))]"><Trash2 size={14}/></Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-display text-2xl">Create coupon</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div><Label>Code</Label><Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="WELCOME10" className="font-mono"/></div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                    <SelectItem value="flat">Flat amount (₹)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Value</Label><Input type="number" value={form.value} onChange={(e) => setForm({ ...form, value: Number(e.target.value) })}/></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Min order (₹)</Label><Input type="number" value={form.min_order} onChange={(e) => setForm({ ...form, min_order: Number(e.target.value) })}/></div>
              <div><Label>Max uses</Label><Input type="number" value={form.max_uses} onChange={(e) => setForm({ ...form, max_uses: Number(e.target.value) })}/></div>
            </div>
            <div><Label>Description</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}/></div>
          </div>
          <DialogFooter><Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={create} data-testid="coupon-save-button">Create</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
