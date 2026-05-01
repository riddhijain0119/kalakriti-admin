import React, { useEffect, useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { adminApi, publicApi } from "@/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Trash2, Loader2, Image as ImageIcon } from "lucide-react";

export default function GalleryPage() {
  const [items, setItems] = useState([]);
  const [mediums, setMediums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", medium: "watercolour", before_url: "", after_url: "", featured: true, sort_order: 0 });

  const load = async () => {
    try {
      const [a, b] = await Promise.all([adminApi.listGallery(), publicApi.mediums()]);
      setItems(a); setMediums(b);
    } catch { toast.error("Failed"); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!form.after_url) return toast.error("After URL required");
    try { await adminApi.createGallery(form); toast.success("Added"); setOpen(false); setForm({ title: "", medium: "watercolour", before_url: "", after_url: "", featured: true, sort_order: 0 }); load(); }
    catch { toast.error("Failed"); }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this item?")) return;
    try { await adminApi.deleteGallery(id); toast.success("Deleted"); load(); }
    catch { toast.error("Failed"); }
  };

  const toggleFeat = async (item) => {
    try { await adminApi.updateGallery(item.id, { featured: !item.featured }); load(); }
    catch { toast.error("Failed"); }
  };

  return (
    <AdminLayout
      title="Gallery"
      subtitle="Portfolio images shown on kalakritishop.in. Before/after pairs build trust."
      actions={<Button onClick={() => setOpen(true)} data-testid="gallery-add-button"><Plus size={14} className="mr-2"/>Add image</Button>}
    >
      {loading ? (
        <div className="py-16 text-center"><Loader2 className="inline animate-spin"/></div>
      ) : items.length === 0 ? (
        <div className="luxury-card p-16 text-center">
          <ImageIcon className="mx-auto text-[hsl(var(--muted-foreground))]/60 mb-4" size={40}/>
          <h3 className="font-display text-xl font-semibold">Your gallery is empty</h3>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1 mb-4">Upload before/after pairs to build trust on the storefront.</p>
          <Button onClick={() => setOpen(true)}>Upload images</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="gallery-grid">
          {items.map((it) => (
            <div key={it.id} className="luxury-card overflow-hidden">
              <div className="relative aspect-[4/3] bg-[hsl(var(--secondary))]">
                <img src={it.after_url} alt={it.title} className="w-full h-full object-cover"/>
                {it.before_url && <div className="absolute inset-0 w-1/2 border-r border-white/50"><img src={it.before_url} alt="before" className="w-full h-full object-cover"/></div>}
                <div className="absolute top-2 left-2 text-[10px] uppercase tracking-wider bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] px-2 py-1 rounded capitalize">{it.medium?.replace("-", " ")}</div>
              </div>
              <div className="p-3 flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">{it.title}</div>
                  <div className="text-[10px] text-[hsl(var(--muted-foreground))] flex items-center gap-2 mt-1">
                    <Switch checked={it.featured} onCheckedChange={() => toggleFeat(it)}/> Featured
                  </div>
                </div>
                <Button size="icon" variant="ghost" onClick={() => remove(it.id)} className="text-[hsl(var(--destructive))]"><Trash2 size={14}/></Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-display text-2xl">Add gallery item</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}/></div>
            <div>
              <Label>Medium</Label>
              <Select value={form.medium} onValueChange={(v) => setForm({ ...form, medium: v })}>
                <SelectTrigger><SelectValue/></SelectTrigger>
                <SelectContent>{mediums.map((m) => <SelectItem key={m.slug} value={m.slug}>{m.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Before URL (optional)</Label><Input value={form.before_url} onChange={(e) => setForm({ ...form, before_url: e.target.value })} placeholder="https://..."/></div>
            <div><Label>After URL (required)</Label><Input value={form.after_url} onChange={(e) => setForm({ ...form, after_url: e.target.value })} placeholder="https://..."/></div>
            <div className="flex items-center gap-2"><Switch checked={form.featured} onCheckedChange={(v) => setForm({ ...form, featured: v })}/> <Label>Featured</Label></div>
          </div>
          <DialogFooter><Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={create} data-testid="gallery-save-button">Add</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
