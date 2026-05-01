import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { adminApi } from "@/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Loader2, Edit3, Check, X, Info } from "lucide-react";
import { toast } from "sonner";

export default function MediumsPage() {
  const [mediums, setMediums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editPrice, setEditPrice] = useState({});
  const [saving, setSaving] = useState({});

  const load = async () => {
    try { setMediums(await adminApi.listMediums()); }
    catch { toast.error("Failed to load listings"); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const startEdit = (m) => {
    setEditPrice({ ...editPrice, [m.id]: { price: m.base_price, turnMin: m.turnaround_min, turnMax: m.turnaround_max } });
  };
  const cancelEdit = (id) => {
    const copy = { ...editPrice }; delete copy[id]; setEditPrice(copy);
  };

  const saveQuick = async (m) => {
    const ep = editPrice[m.id];
    if (!ep) return;
    setSaving({ ...saving, [m.id]: true });
    try {
      const updated = await adminApi.updateMedium(m.id, {
        base_price: Number(ep.price),
        turnaround_min: Number(ep.turnMin),
        turnaround_max: Number(ep.turnMax),
      });
      setMediums(mediums.map((x) => (x.id === m.id ? updated : x)));
      cancelEdit(m.id);
      toast.success(`${m.name} updated — price is now ₹${Number(ep.price).toLocaleString("en-IN")}`);
    } catch {
      toast.error("Save failed");
    } finally {
      setSaving({ ...saving, [m.id]: false });
    }
  };

  const toggleActive = async (m) => {
    try {
      const updated = await adminApi.updateMedium(m.id, { active: !m.active });
      setMediums(mediums.map((x) => (x.id === m.id ? updated : x)));
      toast.success(`${m.name} ${updated.active ? "published" : "unpublished"}`);
    } catch { toast.error("Failed"); }
  };

  return (
    <AdminLayout
      title="Listings & Pricing"
      subtitle="Change prices, turnaround, and details for each portrait listing. Quick-edit prices below or click 'Edit full listing' for all fields."
    >
      <div className="mb-4 flex items-start gap-2 text-xs text-[hsl(var(--muted-foreground))] bg-[rgba(201,168,76,0.1)] border border-[rgba(201,168,76,0.25)] rounded-lg p-3">
        <Info size={14} className="text-[hsl(var(--accent))] mt-0.5 flex-shrink-0" />
        <div>
          <strong className="text-[hsl(var(--primary))]">Tip:</strong> Click the pencil icon on any card to quick-edit price & turnaround. Click <strong>Edit full listing</strong> for sizes, badge, per-face price, rush fee, image, and description. Changes go live instantly on kalakritishop.in.
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center"><Loader2 className="inline animate-spin" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4" data-testid="mediums-grid">
          {mediums.map((m) => {
            const editing = !!editPrice[m.id];
            const isSaving = !!saving[m.id];
            return (
              <div key={m.id} className="luxury-card overflow-hidden flex flex-col">
                <div className="relative aspect-[4/3] bg-[hsl(var(--secondary))]">
                  {m.image_url ? (
                    <img src={m.image_url} alt={m.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[hsl(var(--muted-foreground))]">No image</div>
                  )}
                  {m.badge && (
                    <div className="absolute top-2 left-2 text-[10px] font-semibold uppercase tracking-wider bg-[hsl(var(--accent))] text-[hsl(var(--primary))] px-2 py-1 rounded">
                      {m.badge}
                    </div>
                  )}
                  {!m.active && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-sm font-medium">
                      Unpublished
                    </div>
                  )}
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <div>
                    <h3 className="font-display text-xl font-semibold text-[hsl(var(--primary))]">{m.name}</h3>
                    <p className="text-xs text-[hsl(var(--muted-foreground))] line-clamp-1">{m.tagline}</p>
                  </div>

                  {!editing ? (
                    <div className="mt-3 flex items-end justify-between">
                      <div>
                        <div className="text-[10px] uppercase tracking-widest text-[hsl(var(--muted-foreground))]">Base price</div>
                        <div className="font-display text-2xl font-semibold tabular-nums text-[hsl(var(--primary))]">
                          ₹{Number(m.base_price).toLocaleString("en-IN")}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] uppercase tracking-widest text-[hsl(var(--muted-foreground))]">Turnaround</div>
                        <div className="text-xs font-medium">{m.turnaround_min}–{m.turnaround_max} days</div>
                      </div>
                      <button
                        onClick={() => startEdit(m)}
                        data-testid={`quick-edit-price-${m.slug}`}
                        title="Quick edit price"
                        className="p-2 rounded-md hover:bg-[rgba(44,24,16,0.06)] transition-colors text-[hsl(var(--accent))]"
                      >
                        <Edit3 size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="mt-3 space-y-2 bg-[rgba(201,168,76,0.08)] rounded-md p-3">
                      <div>
                        <label className="text-[10px] uppercase tracking-widest text-[hsl(var(--muted-foreground))]">New price (₹)</label>
                        <Input
                          type="number"
                          value={editPrice[m.id].price}
                          onChange={(e) => setEditPrice({ ...editPrice, [m.id]: { ...editPrice[m.id], price: e.target.value } })}
                          className="h-9 text-sm font-mono"
                          data-testid={`quick-price-input-${m.slug}`}
                          autoFocus
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] uppercase tracking-widest text-[hsl(var(--muted-foreground))]">Min days</label>
                          <Input type="number" className="h-9 text-sm" value={editPrice[m.id].turnMin} onChange={(e) => setEditPrice({ ...editPrice, [m.id]: { ...editPrice[m.id], turnMin: e.target.value } })} />
                        </div>
                        <div>
                          <label className="text-[10px] uppercase tracking-widest text-[hsl(var(--muted-foreground))]">Max days</label>
                          <Input type="number" className="h-9 text-sm" value={editPrice[m.id].turnMax} onChange={(e) => setEditPrice({ ...editPrice, [m.id]: { ...editPrice[m.id], turnMax: e.target.value } })} />
                        </div>
                      </div>
                      <div className="flex gap-2 pt-1">
                        <Button size="sm" onClick={() => saveQuick(m)} disabled={isSaving} className="flex-1 h-8" data-testid={`quick-save-${m.slug}`}>
                          {isSaving ? <Loader2 size={13} className="animate-spin" /> : <><Check size={13} className="mr-1" />Save price</>}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => cancelEdit(m.id)} disabled={isSaving} className="h-8">
                          <X size={13} />
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="mt-4 pt-3 border-t border-[hsl(var(--border))] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Switch checked={!!m.active} onCheckedChange={() => toggleActive(m)} data-testid={`medium-published-${m.slug}`} />
                      <span className="text-xs text-[hsl(var(--muted-foreground))]">{m.active ? "Published" : "Hidden"}</span>
                    </div>
                    <Link to={`/mediums/${m.id}`} data-testid={`medium-edit-${m.slug}`}>
                      <Button size="sm" variant="secondary" className="h-8">
                        <Edit3 size={13} className="mr-1.5" />Edit full listing
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AdminLayout>
  );
}
