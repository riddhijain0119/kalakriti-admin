import React, { useEffect, useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { adminApi, publicApi } from "@/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { ImageUpload } from "@/components/ImageUpload";
import { toast } from "sonner";
import { Plus, Trash2, Loader2, Image as ImageIcon, UploadCloud } from "lucide-react";

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

  const resetForm = () => setForm({ title: "", medium: "watercolour", before_url: "", after_url: "", featured: true, sort_order: 0 });

  const create = async () => {
    if (!form.after_url) return toast.error("Please upload or paste the 'After' image first.");
    try {
      await adminApi.createGallery(form);
      toast.success("Added to gallery — live on kalakritishop.in");
      setOpen(false);
      resetForm();
      load();
    } catch { toast.error("Failed to save"); }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this gallery item?")) return;
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
      subtitle="Upload portfolio images shown on kalakritishop.in. Use before/after pairs to build trust."
      actions={
        <Button onClick={() => setOpen(true)} data-testid="gallery-add-button">
          <UploadCloud size={14} className="mr-2" />Upload new image
        </Button>
      }
    >
      {loading ? (
        <div className="py-16 text-center"><Loader2 className="inline animate-spin" /></div>
      ) : items.length === 0 ? (
        <div className="luxury-card p-16 text-center">
          <ImageIcon className="mx-auto text-[hsl(var(--muted-foreground))]/60 mb-4" size={40} />
          <h3 className="font-display text-xl font-semibold">Your gallery is empty</h3>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1 mb-4">Upload before/after pairs to build trust on the storefront.</p>
          <Button onClick={() => setOpen(true)}><UploadCloud size={14} className="mr-2" />Upload images</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="gallery-grid">
          {items.map((it) => (
            <div key={it.id} className="luxury-card overflow-hidden">
              <div className="relative aspect-[4/3] bg-[hsl(var(--secondary))]">
                <img src={it.after_url} alt={it.title} className="w-full h-full object-cover" />
                {it.before_url && <div className="absolute inset-0 w-1/2 border-r border-white/50"><img src={it.before_url} alt="before" className="w-full h-full object-cover" /></div>}
                <div className="absolute top-2 left-2 text-[10px] uppercase tracking-wider bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] px-2 py-1 rounded capitalize">{it.medium?.replace("-", " ")}</div>
              </div>
              <div className="p-3 flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">{it.title || "Untitled"}</div>
                  <div className="text-[10px] text-[hsl(var(--muted-foreground))] flex items-center gap-2 mt-1">
                    <Switch checked={it.featured} onCheckedChange={() => toggleFeat(it)} /> Featured
                  </div>
                </div>
                <Button size="icon" variant="ghost" onClick={() => remove(it.id)} className="text-[hsl(var(--destructive))]"><Trash2 size={14} /></Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">Upload gallery image</DialogTitle>
            <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">Upload a high-quality photo of a completed portrait. Optionally add a “Before” (original photo) to create a transformation slider.</p>
          </DialogHeader>
          <div className="space-y-4 py-2 max-h-[70vh] overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ImageUpload
                value={form.before_url}
                onChange={(url) => setForm({ ...form, before_url: url })}
                label="Before (original photo) — optional"
                aspect="square"
                testid="gallery-before-upload"
              />
              <ImageUpload
                value={form.after_url}
                onChange={(url) => setForm({ ...form, after_url: url })}
                label="After (finished portrait) — required"
                aspect="square"
                testid="gallery-after-upload"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label>Title</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Anniversary couple" data-testid="gallery-title-input" />
              </div>
              <div>
                <Label>Medium</Label>
                <Select value={form.medium} onValueChange={(v) => setForm({ ...form, medium: v })}>
                  <SelectTrigger data-testid="gallery-medium-select"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {mediums.map((m) => <SelectItem key={m.slug} value={m.slug}>{m.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.featured} onCheckedChange={(v) => setForm({ ...form, featured: v })} />
              <Label>Feature on homepage</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={create} disabled={!form.after_url} data-testid="gallery-save-button">Add to gallery</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
