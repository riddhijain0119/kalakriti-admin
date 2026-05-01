import React, { useEffect, useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { adminApi } from "@/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Save, Loader2, Plus, Trash2 } from "lucide-react";

export default function ContentPage() {
  const [c, setC] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try { setC(await adminApi.getHomepage()); }
    catch { toast.error("Failed"); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    setSaving(true);
    try {
      const updated = await adminApi.updateHomepage(c);
      setC(updated);
      toast.success("Homepage content saved");
    } catch { toast.error("Save failed"); }
    finally { setSaving(false); }
  };

  if (loading || !c) return <AdminLayout title="Loading..."><div className="py-16 text-center"><Loader2 className="inline animate-spin"/></div></AdminLayout>;

  const updateStat = (i, k, v) => {
    const arr = [...(c.stats || [])]; arr[i] = { ...arr[i], [k]: v }; setC({ ...c, stats: arr });
  };
  const addStat = () => setC({ ...c, stats: [...(c.stats || []), { label: "", value: "" }] });
  const removeStat = (i) => setC({ ...c, stats: c.stats.filter((_, idx) => idx !== i) });

  const updateStep = (i, k, v) => {
    const arr = [...(c.process_steps || [])]; arr[i] = { ...arr[i], [k]: v }; setC({ ...c, process_steps: arr });
  };
  const addStep = () => setC({ ...c, process_steps: [...(c.process_steps || []), { title: "", description: "", icon: "" }] });
  const removeStep = (i) => setC({ ...c, process_steps: c.process_steps.filter((_, idx) => idx !== i) });

  return (
    <AdminLayout
      title="Homepage content"
      subtitle="Edit hero text, stats, process steps, and CTA copy. Changes go live on kalakritishop.in."
      actions={<Button onClick={save} disabled={saving} data-testid="content-save-button">{saving ? <><Loader2 size={14} className="animate-spin mr-2"/>Saving...</> : <><Save size={14} className="mr-2"/>Save changes</>}</Button>}
    >
      <div className="space-y-5 max-w-4xl">
        {/* Hero */}
        <div className="luxury-card p-5">
          <div className="section-label mb-4">Hero section</div>
          <div className="space-y-3">
            <div><Label>Eyebrow</Label><Input value={c.hero_eyebrow || ""} onChange={(e) => setC({ ...c, hero_eyebrow: e.target.value })}/></div>
            <div><Label>Title</Label><Input value={c.hero_title || ""} onChange={(e) => setC({ ...c, hero_title: e.target.value })}/></div>
            <div><Label>Subtitle</Label><Textarea rows={2} value={c.hero_subtitle || ""} onChange={(e) => setC({ ...c, hero_subtitle: e.target.value })}/></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Primary CTA text</Label><Input value={c.hero_cta_primary || ""} onChange={(e) => setC({ ...c, hero_cta_primary: e.target.value })}/></div>
              <div><Label>Secondary CTA text</Label><Input value={c.hero_cta_secondary || ""} onChange={(e) => setC({ ...c, hero_cta_secondary: e.target.value })}/></div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="luxury-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="section-label">Stats strip</div>
            <Button size="sm" variant="secondary" onClick={addStat}><Plus size={14} className="mr-2"/>Add stat</Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {(c.stats || []).map((s, i) => (
              <div key={i} className="flex gap-2 items-end">
                <div className="flex-1"><Label className="text-[10px]">Value</Label><Input value={s.value} onChange={(e) => updateStat(i, "value", e.target.value)} placeholder="2,400+"/></div>
                <div className="flex-1"><Label className="text-[10px]">Label</Label><Input value={s.label} onChange={(e) => updateStat(i, "label", e.target.value)} placeholder="Portraits Delivered"/></div>
                <Button size="icon" variant="ghost" onClick={() => removeStat(i)} className="text-[hsl(var(--destructive))]"><Trash2 size={14}/></Button>
              </div>
            ))}
          </div>
        </div>

        {/* Process steps */}
        <div className="luxury-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="section-label">Process steps</div>
            <Button size="sm" variant="secondary" onClick={addStep}><Plus size={14} className="mr-2"/>Add step</Button>
          </div>
          <div className="space-y-3">
            {(c.process_steps || []).map((s, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-start">
                <div className="col-span-2"><Label className="text-[10px]">Icon</Label><Input value={s.icon || ""} onChange={(e) => updateStep(i, "icon", e.target.value)} placeholder="palette"/></div>
                <div className="col-span-3"><Label className="text-[10px]">Title</Label><Input value={s.title} onChange={(e) => updateStep(i, "title", e.target.value)}/></div>
                <div className="col-span-6"><Label className="text-[10px]">Description</Label><Textarea rows={2} value={s.description} onChange={(e) => updateStep(i, "description", e.target.value)}/></div>
                <div className="col-span-1 pt-6"><Button size="icon" variant="ghost" onClick={() => removeStep(i)} className="text-[hsl(var(--destructive))]"><Trash2 size={14}/></Button></div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="luxury-card p-5">
          <div className="section-label mb-4">Bottom CTA</div>
          <div className="space-y-3">
            <div><Label>CTA title</Label><Input value={c.cta_title || ""} onChange={(e) => setC({ ...c, cta_title: e.target.value })}/></div>
            <div><Label>CTA subtitle</Label><Textarea rows={2} value={c.cta_subtitle || ""} onChange={(e) => setC({ ...c, cta_subtitle: e.target.value })}/></div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
