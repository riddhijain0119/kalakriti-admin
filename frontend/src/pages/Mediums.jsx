import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { adminApi } from "@/api";
import { Button } from "@/components/ui/button";
import { Loader2, Edit3, Plus } from "lucide-react";
import { toast } from "sonner";

export default function MediumsPage() {
  const [mediums, setMediums] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try { setMediums(await adminApi.listMediums()); }
    catch { toast.error("Failed to load mediums"); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  return (
    <AdminLayout
      title="Mediums"
      subtitle="Edit pricing, turnaround, and details for each portrait medium. Changes appear instantly on kalakritishop.in."
    >
      {loading ? (
        <div className="py-16 text-center"><Loader2 className="inline animate-spin"/></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4" data-testid="mediums-grid">
          {mediums.map((m) => (
            <div key={m.id} className="luxury-card overflow-hidden">
              <div className="relative aspect-[4/3] bg-[hsl(var(--secondary))]">
                {m.image_url ? <img src={m.image_url} alt={m.name} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-[hsl(var(--muted-foreground))]">No image</div>}
                {m.badge && <div className="absolute top-2 left-2 text-[10px] font-semibold uppercase tracking-wider bg-[hsl(var(--accent))] text-[hsl(var(--primary))] px-2 py-1 rounded">{m.badge}</div>}
                {!m.active && <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-sm font-medium">Inactive</div>}
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-display text-xl font-semibold text-[hsl(var(--primary))]">{m.name}</h3>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">{m.tagline}</p>
                  </div>
                </div>
                <div className="mt-3 flex items-end justify-between">
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-[hsl(var(--muted-foreground))]">From</div>
                    <div className="font-display text-2xl font-semibold tabular-nums">₹{Number(m.base_price).toLocaleString("en-IN")}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] uppercase tracking-widest text-[hsl(var(--muted-foreground))]">Turnaround</div>
                    <div className="text-xs font-medium">{m.turnaround_min}–{m.turnaround_max} days</div>
                  </div>
                </div>
                <Link to={`/mediums/${m.id}`} data-testid={`medium-edit-${m.slug}`}>
                  <Button size="sm" variant="secondary" className="w-full mt-4"><Edit3 size={14} className="mr-2"/>Edit medium</Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
