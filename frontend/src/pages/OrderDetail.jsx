import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { adminApi } from "@/api";
import { StatusChip } from "@/components/StatusChip";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ArrowLeft, Loader2, Truck, MapPin, User, Phone, Mail, Clock, Save, Eye, Download, Package2 } from "lucide-react";
import { toast } from "sonner";

const STATUSES = ["NEW", "PAYMENT_RECEIVED", "ASSIGNED", "IN_PROGRESS", "DRAFT_SHARED", "REVISIONS", "APPROVED", "PRINTING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"];

export default function OrderDetailPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingNotes, setSavingNotes] = useState(false);
  const [notes, setNotes] = useState("");
  const [statusDraft, setStatusDraft] = useState("");
  const [shipModal, setShipModal] = useState(false);
  const [couriers, setCouriers] = useState([]);
  const [chosenCourier, setChosenCourier] = useState("");
  const [shippingLoad, setShippingLoad] = useState(false);
  const [lightbox, setLightbox] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const o = await adminApi.getOrder(id);
      setOrder(o);
      setNotes(o.notes || "");
      setStatusDraft(o.status);
    } catch {
      toast.error("Order not found");
      nav("/orders");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  const saveStatus = async (newStatus) => {
    try {
      const updated = await adminApi.updateOrderStatus(id, newStatus, `Status updated to ${newStatus}`);
      setOrder(updated);
      setStatusDraft(newStatus);
      toast.success(`Status updated to ${newStatus.replace(/_/g, " ")}`);
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Failed to update status");
    }
  };

  const saveNotes = async () => {
    setSavingNotes(true);
    try {
      const updated = await adminApi.updateOrderNotes(id, notes);
      setOrder(updated);
      toast.success("Notes saved");
    } catch {
      toast.error("Failed to save notes");
    } finally {
      setSavingNotes(false);
    }
  };

  const openShip = async () => {
    setShipModal(true);
    setShippingLoad(true);
    setCouriers([]);
    try {
      const res = await adminApi.checkServiceability(id);
      const list = res.couriers || [];
      setCouriers(list);
      if (list.length > 0) setChosenCourier(String(list[0].courier_company_id));
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Courier lookup failed");
    } finally {
      setShippingLoad(false);
    }
  };

  const confirmShip = async () => {
    setShippingLoad(true);
    try {
      const res = await adminApi.shipOrder(id, {
        order_id: id,
        courier_id: chosenCourier ? parseInt(chosenCourier) : undefined,
        prefer: "cheapest",
      });
      if (res.success) {
        toast.success(`Shipped via ${res.courier_name}. AWB: ${res.awb_code}`);
      } else {
        toast.warning("Shipment created but AWB pending. Check Shiprocket dashboard.");
      }
      setShipModal(false);
      await load();
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Shipping failed");
    } finally {
      setShippingLoad(false);
    }
  };

  if (loading || !order) {
    return (
      <AdminLayout title="Loading order">
        <div className="flex items-center justify-center py-32"><Loader2 className="animate-spin"/></div>
      </AdminLayout>
    );
  }

  const shipped = !!order.shipping?.awb_code;

  return (
    <AdminLayout
      title={`Order ${order.order_number}`}
      subtitle={`Placed ${new Date(order.created_at).toLocaleString()}`}
      actions={
        <Link to="/orders"><Button variant="ghost" data-testid="order-back-button"><ArrowLeft size={14} className="mr-2"/> Back to orders</Button></Link>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* LEFT */}
        <div className="lg:col-span-2 space-y-5">
          {/* Status + Timeline */}
          <div className="luxury-card p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="section-label">Status</div>
                <div className="mt-2 flex items-center gap-3">
                  <StatusChip status={order.status} />
                  {order.rush && <span className="text-[10px] uppercase tracking-wider text-[hsl(var(--warning))] font-medium">Rush order</span>}
                </div>
              </div>
              <Select value={statusDraft} onValueChange={saveStatus}>
                <SelectTrigger className="w-[200px]" data-testid="order-detail-status-select"><SelectValue/></SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="section-label">Timeline</div>
            <div className="mt-3 space-y-3" data-testid="order-status-timeline">
              {(order.timeline || []).slice().reverse().map((e, i) => (
                <div key={i} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-2.5 h-2.5 rounded-full ${i === 0 ? "bg-[hsl(var(--accent))]" : "bg-[hsl(var(--muted-foreground))]/40"}`} />
                    {i < order.timeline.length - 1 && <div className="w-px flex-1 bg-[hsl(var(--border))]" />}
                  </div>
                  <div className="pb-3 flex-1">
                    <div className="text-sm font-medium">{e.status.replace(/_/g, " ")}</div>
                    {e.note && <div className="text-xs text-[hsl(var(--muted-foreground))]">{e.note}</div>}
                    <div className="text-[10px] text-[hsl(var(--muted-foreground))] mt-0.5 flex items-center gap-1"><Clock size={10}/> {new Date(e.at).toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Reference photos */}
          <div className="luxury-card p-5">
            <div className="section-label mb-3">Reference photos ({order.references?.length || 0})</div>
            {(!order.references || order.references.length === 0) ? (
              <div className="py-10 text-center text-sm text-[hsl(var(--muted-foreground))]">
                No references uploaded yet.
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {order.references.map((r, i) => (
                  <button key={i} onClick={() => setLightbox(r.url)} data-testid={`order-reference-photo-${i}`}
                    className="relative aspect-square overflow-hidden rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] group">
                    <img src={r.url} alt={r.filename || `Reference ${i+1}`} className="w-full h-full object-cover transition-transform group-hover:scale-105"/>
                    <div className="absolute inset-0 bg-[hsl(var(--primary))]/0 group-hover:bg-[hsl(var(--primary))]/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <Eye size={18} className="text-white"/>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="luxury-card p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="section-label">Internal notes</div>
              <Button size="sm" variant="secondary" onClick={saveNotes} disabled={savingNotes} data-testid="order-save-notes-button">
                <Save size={14} className="mr-2"/>{savingNotes ? "Saving..." : "Save"}
              </Button>
            </div>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Artist assignment, special instructions, customer preferences..." rows={4} data-testid="order-notes-textarea"/>
          </div>
        </div>

        {/* RIGHT */}
        <div className="space-y-5">
          {/* Customer */}
          <div className="luxury-card p-5">
            <div className="section-label mb-3">Customer</div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2"><User size={14} className="text-[hsl(var(--muted-foreground))]"/> <span className="font-medium">{order.customer.name}</span></div>
              <div className="flex items-center gap-2"><Mail size={14} className="text-[hsl(var(--muted-foreground))]"/> {order.customer.email}</div>
              <div className="flex items-center gap-2"><Phone size={14} className="text-[hsl(var(--muted-foreground))]"/> {order.customer.phone}</div>
              <div className="flex gap-2 pt-1">
                <MapPin size={14} className="text-[hsl(var(--muted-foreground))] flex-shrink-0 mt-0.5"/>
                <div className="text-[hsl(var(--primary))]/80 leading-relaxed">
                  {order.customer.address}<br/>
                  {order.customer.city}, {order.customer.state} {order.customer.pincode}<br/>
                  {order.customer.country}
                </div>
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="luxury-card p-5">
            <div className="section-label mb-3">Pricing</div>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-[hsl(var(--muted-foreground))]">Base ({order.medium_name})</dt><dd className="font-mono tabular-nums">₹{Number(order.pricing?.base_price || 0).toLocaleString("en-IN")}</dd></div>
              {order.pricing?.size_multiplier !== 1 && <div className="flex justify-between"><dt className="text-[hsl(var(--muted-foreground))]">Size ({order.size}) × {order.pricing?.size_multiplier}</dt><dd/></div>}
              {order.faces > 1 && <div className="flex justify-between"><dt className="text-[hsl(var(--muted-foreground))]">Extra faces ({order.faces - 1}×₹{order.pricing?.per_face_price})</dt><dd className="font-mono tabular-nums">₹{((order.faces - 1) * (order.pricing?.per_face_price || 0)).toLocaleString("en-IN")}</dd></div>}
              {order.pricing?.rush_fee > 0 && <div className="flex justify-between"><dt className="text-[hsl(var(--muted-foreground))]">Rush fee</dt><dd className="font-mono tabular-nums">₹{Number(order.pricing.rush_fee).toLocaleString("en-IN")}</dd></div>}
              {order.pricing?.discount > 0 && <div className="flex justify-between text-[hsl(var(--success))]"><dt>Discount ({order.pricing.coupon_code})</dt><dd className="font-mono tabular-nums">-₹{Number(order.pricing.discount).toLocaleString("en-IN")}</dd></div>}
              <div className="border-t border-[hsl(var(--border))] my-2"/>
              <div className="flex justify-between font-semibold text-base"><dt>Total</dt><dd className="font-mono tabular-nums" data-testid="order-total">₹{Number(order.pricing?.total || 0).toLocaleString("en-IN")}</dd></div>
              <div className="flex justify-between text-xs">
                <dt className="text-[hsl(var(--muted-foreground))]">Payment</dt>
                <dd className={order.payment?.status === "PAID" ? "text-[hsl(var(--success))] font-medium" : "text-[hsl(var(--muted-foreground))]"}>{order.payment?.status || "PENDING"}</dd>
              </div>
            </dl>
          </div>

          {/* Shipping */}
          <div className="luxury-card p-5">
            <div className="section-label mb-3">Shipping</div>
            {shipped ? (
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2"><Package2 size={14} className="text-[hsl(var(--success))]"/> <span className="font-medium">Shipped</span></div>
                <div className="text-xs text-[hsl(var(--muted-foreground))]">Courier: <span className="text-[hsl(var(--primary))] font-medium">{order.shipping.courier_name}</span></div>
                <div className="text-xs text-[hsl(var(--muted-foreground))]">AWB: <span className="font-mono text-[hsl(var(--primary))]">{order.shipping.awb_code}</span></div>
                {order.shipping.label_url && (
                  <a href={order.shipping.label_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-[hsl(var(--accent))] hover:underline mt-2"><Download size={12}/> Download label</a>
                )}
              </div>
            ) : (
              <div>
                <p className="text-sm text-[hsl(var(--muted-foreground))] mb-3">Ship this order via Shiprocket. Your pickup location and package defaults will be used.</p>
                <Button
                  onClick={openShip}
                  data-testid="order-detail-shiprocket-button"
                  className="w-full"
                >
                  <Truck size={15} className="mr-2"/> Ship with Shiprocket
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Ship Modal */}
      <Dialog open={shipModal} onOpenChange={setShipModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">Ship order via Shiprocket</DialogTitle>
            <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">Pickup from pincode 201301. Select a courier for {order.customer.city || "destination"} {order.customer.pincode}.</p>
          </DialogHeader>
          <div className="py-3">
            {shippingLoad && couriers.length === 0 ? (
              <div className="py-10 text-center text-sm text-[hsl(var(--muted-foreground))]"><Loader2 className="inline animate-spin mr-2"/>Fetching available couriers...</div>
            ) : couriers.length === 0 ? (
              <div className="py-10 text-center text-sm text-[hsl(var(--destructive))]">No couriers available for this pincode.</div>
            ) : (
              <div className="max-h-80 overflow-y-auto space-y-2">
                {couriers.map((c) => (
                  <label
                    key={c.courier_company_id}
                    className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${String(chosenCourier) === String(c.courier_company_id) ? "border-[hsl(var(--accent))] bg-[rgba(201,168,76,0.08)]" : "border-[hsl(var(--border))] hover:bg-[rgba(44,24,16,0.03)]"}`}
                  >
                    <div className="flex items-center gap-3">
                      <input type="radio" name="courier" value={c.courier_company_id} checked={String(chosenCourier) === String(c.courier_company_id)} onChange={(e) => setChosenCourier(e.target.value)} className="accent-[hsl(var(--accent))]"/>
                      <div>
                        <div className="text-sm font-medium">{c.courier_name}</div>
                        <div className="text-xs text-[hsl(var(--muted-foreground))]">ETD: {c.etd || `${c.estimated_delivery_days || "?"} days`}</div>
                      </div>
                    </div>
                    <div className="font-mono text-sm">₹{Number(c.rate).toLocaleString("en-IN")}</div>
                  </label>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShipModal(false)} disabled={shippingLoad}>Cancel</Button>
            <Button onClick={confirmShip} disabled={shippingLoad || !chosenCourier || couriers.length === 0} data-testid="ship-confirm-button">
              {shippingLoad ? <><Loader2 size={14} className="animate-spin mr-2"/>Shipping...</> : "Confirm shipment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lightbox */}
      <Dialog open={!!lightbox} onOpenChange={() => setLightbox(null)}>
        <DialogContent className="max-w-3xl">
          {lightbox && <img src={lightbox} alt="Reference" className="w-full rounded-lg"/>}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
