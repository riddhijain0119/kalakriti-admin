import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { adminApi } from "@/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Save, Loader2, Trash2, Plus } from "lucide-react";

const BADGES = ["", "Most Popular", "Best Value", "Premium", "New"];

export default function MediumEditorPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const [m, setM] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try { setM(await adminApi.getMedium(id)); }
      catch { toast.error("Not found"); nav("/mediums"); }
      finally { setLoading(false); }
    })();
    // eslint-disable-next-line
  }, [id]);

  const save = async () => {
    setSaving(true);
    try {
      const body = {
        name: m.name, tagline: m.tagline, description: m.description,
        base_price: Number(m.base_price), turnaround_min: Number(m.turnaround_min), turnaround_max: Number(m.turnaround_max),
        image_url: m.image_url, badge: m.badge || null, active: !!m.active,
        size_options: (m.size_options || []).map((s) => ({ size: s.size, multiplier: Number(s.multiplier), label: s.label || "" })),
        per_face_price: Number(m.per_face_price), rush_fee_percent: Number(m.rush_fee_percent),
      };
      const updated = await adminApi.updateMedium(id, body);
      setM(updated);
      toast.success("Medium saved");
    } catch (e) { toast.error(e?.response?.data?.detail || "Save failed"); }
    finally { setSaving(false); }
  };

  if (loading || !m) return <AdminLayout title="Loading..."><div className="py-16 text-center"><Loader2 className="animate-spin inline"/></div></AdminLayout>;

  const addSize = () => setM({ ...m, size_options: [...(m.size_options || []), { size: "", multiplier: 1.0, label: "" }] });
  const removeSize = (i) => setM({ ...m, size_options: m.size_options.filter((_, idx) => idx !== i) });
  const updateSize = (i, k, v) => {
    const arr = [...m.size_options]; arr[i] = { ...arr[i], [k]: v }; setM({ ...m, size_options: arr });
  };

  return (
    <AdminLayout
      title={`Edit — ${m.name}`}
      subtitle={`Slug: ${m.slug}`}
      actions={<Link to="/mediums"><Button variant="ghost"><ArrowLeft size={14} className="mr-2"/>Back</Button></Link>}
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          {/* Basics */}
          <div className="luxury-card p-5">
            <div className="section-label mb-4">Basics</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Name</Label><Input value={m.name} onChange={(e) => setM({ ...m, name: e.target.value })} data-testid="medium-name-input"/></div>
              <div>
                <Label>Badge</Label>
                <Select value={m.badge || "none"} onValueChange={(v) => setM({ ...m, badge: v === "none" ? null : v })}>
                  <SelectTrigger data-testid="medium-badge-select"><SelectValue/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {BADGES.filter(Boolean).map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="mt-4"><Label>Tagline</Label><Input value={m.tagline} onChange={(e) => setM({ ...m, tagline: e.target.value })}/></div>
            <div className="mt-4"><Label>Description</Label><Textarea rows={3} value={m.description} onChange={(e) => setM({ ...m, description: e.target.value })}/></div>
            <div className="mt-4"><Label>Hero image URL</Label><Input value={m.image_url} onChange={(e) => setM({ ...m, image_url: e.target.value })} placeholder="https://..."/></div>
            {m.image_url && <img src={m.image_url} alt={m.name} className="mt-3 rounded-lg h-40 object-cover" onError={(e) => e.target.style.display = "none"}/>}
          </div>

          {/* Pricing */}
          <div className="luxury-card p-5">
            <div className="section-label mb-4">Pricing</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div><Label>Base price (₹)</Label><Input type="number" value={m.base_price} onChange={(e) => setM({ ...m, base_price: e.target.value })} data-testid="medium-price-input"/></div>
              <div><Label>Per extra face (₹)</Label><Input type="number" value={m.per_face_price} onChange={(e) => setM({ ...m, per_face_price: e.target.value })}/></div>
              <div><Label>Rush fee (%)</Label><Input type="number" value={m.rush_fee_percent} onChange={(e) => setM({ ...m, rush_fee_percent: e.target.value })}/></div>
              <div><Label>Turnaround min (days)</Label><Input type="number" value={m.turnaround_min} onChange={(e) => setM({ ...m, turnaround_min: e.target.value })}/></div>
              <div><Label>Turnaround max (days)</Label><Input type="number" value={m.turnaround_max} onChange={(e) => setM({ ...m, turnaround_max: e.target.value })}/></div>
            </div>
          </div>

          {/* Sizes */}
          <div className="luxury-card p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="section-label">Size options</div>
              <Button size="sm" variant="secondary" onClick={addSize}><Plus size={14} className="mr-2"/>Add size</Button>
            </div>
            {(m.size_options || []).length === 0 ? <div className="text-sm text-[hsl(var(--muted-foreground))] py-6 text-center">No size options</div> : (
              <div className="space-y-2">
                {m.size_options.map((s, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-3"><Label className="text-[10px]">Size</Label><Input value={s.size} onChange={(e) => updateSize(i, "size", e.target.value)} placeholder="A3"/></div>
                    <div className="col-span-5"><Label className="text-[10px]">Label</Label><Input value={s.label || ""} onChange={(e) => updateSize(i, "label", e.target.value)} placeholder='11.7" x 16.5"'/></div>
                    <div className="col-span-3"><Label className="text-[10px]">Multiplier</Label><Input type="number" step="0.1" value={s.multiplier} onChange={(e) => updateSize(i, "multiplier", e.target.value)}/></div>
                    <div className="col-span-1"><Button size="icon" variant="ghost" onClick={() => removeSize(i)} className="h-9 w-9 text-[hsl(var(--destructive))]"><Trash2 size={14}/></Button></div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-5">
          <div className="luxury-card p-5">
            <div className="section-label mb-3">Visibility</div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">Active on storefront</div>
                <div className="text-xs text-[hsl(var(--muted-foreground))]">Hides from kalakritishop.in if off</div>
              </div>
              <Switch checked={!!m.active} onCheckedChange={(v) => setM({ ...m, active: v })} data-testid="medium-active-switch"/>
            </div>
          </div>
          <div className="luxury-card p-5">
            <Button onClick={save} disabled={saving} className="w-full" data-testid="medium-editor-save-button">
              {saving ? <><Loader2 size={14} className="animate-spin mr-2"/>Saving...</> : <><Save size={14} className="mr-2"/>Save medium</>}
            </Button>
            <p className="text-[11px] text-[hsl(var(--muted-foreground))] mt-2 text-center">Changes are live on the public API instantly.</p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
