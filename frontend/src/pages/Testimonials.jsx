import React, { useEffect, useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { adminApi } from "@/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Trash2, Loader2, Quote, Star } from "lucide-react";

export default function TestimonialsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", location: "", quote: "", rating: 5, medium: "", delivered_days: 7, avatar_url: "", featured: true, sort_order: 0 });

  const load = async () => {
    try { setItems(await adminApi.listTestimonials()); }
    catch { toast.error("Failed"); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!form.name || !form.quote) return toast.error("Name and quote required");
    try { await adminApi.createTestimonial(form); toast.success("Added"); setOpen(false); setForm({ name: "", location: "", quote: "", rating: 5, medium: "", delivered_days: 7, avatar_url: "", featured: true, sort_order: 0 }); load(); }
    catch { toast.error("Failed"); }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete testimonial?")) return;
    try { await adminApi.deleteTestimonial(id); toast.success("Deleted"); load(); }
    catch { toast.error("Failed"); }
  };

  return (
    <AdminLayout
      title="Testimonials"
      subtitle="Client reviews shown on the homepage. Featured items appear first."
      actions={<Button onClick={() => setOpen(true)} data-testid="testimonial-add-button"><Plus size={14} className="mr-2"/>Add testimonial</Button>}
    >
      {loading ? <div className="py-16 text-center"><Loader2 className="inline animate-spin"/></div> : items.length === 0 ? (
        <div className="luxury-card p-16 text-center">
          <Quote className="mx-auto text-[hsl(var(--muted-foreground))]/60 mb-4" size={40}/>
          <h3 className="font-display text-xl font-semibold">No testimonials yet</h3>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1 mb-4">Add client stories to build credibility on your storefront.</p>
          <Button onClick={() => setOpen(true)}>Add testimonial</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {items.map((t) => (
            <div key={t.id} className="luxury-card p-5">
              <div className="flex items-center gap-1 mb-3">
                {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={13} className={i < Math.round(t.rating) ? "fill-[hsl(var(--accent))] text-[hsl(var(--accent))]" : "text-[hsl(var(--muted-foreground))]/30"}/>)}
              </div>
              <p className="text-sm text-[hsl(var(--primary))]/85 italic leading-relaxed">“{t.quote}”</p>
              <div className="mt-4 pt-3 border-t border-[hsl(var(--border))] flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">{t.name}</div>
                  <div className="text-xs text-[hsl(var(--muted-foreground))]">{t.location} {t.medium ? `· ${t.medium}` : ""}</div>
                </div>
                <Button size="icon" variant="ghost" onClick={() => remove(t.id)} className="text-[hsl(var(--destructive))]"><Trash2 size={14}/></Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-display text-2xl">Add testimonial</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}/></div>
              <div><Label>Location</Label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })}/></div>
            </div>
            <div><Label>Quote</Label><Textarea rows={4} value={form.quote} onChange={(e) => setForm({ ...form, quote: e.target.value })}/></div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>Rating</Label><Input type="number" min="1" max="5" step="0.1" value={form.rating} onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })}/></div>
              <div><Label>Medium</Label><Input value={form.medium} onChange={(e) => setForm({ ...form, medium: e.target.value })} placeholder="watercolour"/></div>
              <div><Label>Delivered (days)</Label><Input type="number" value={form.delivered_days || ""} onChange={(e) => setForm({ ...form, delivered_days: Number(e.target.value) })}/></div>
            </div>
            <div><Label>Avatar URL</Label><Input value={form.avatar_url} onChange={(e) => setForm({ ...form, avatar_url: e.target.value })}/></div>
            <div className="flex items-center gap-2"><Switch checked={form.featured} onCheckedChange={(v) => setForm({ ...form, featured: v })}/><Label>Featured</Label></div>
          </div>
          <DialogFooter><Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={create} data-testid="testimonial-save-button">Add</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
