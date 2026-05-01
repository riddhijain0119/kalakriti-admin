import React, { useEffect, useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { adminApi } from "@/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Save, Loader2 } from "lucide-react";

export default function SettingsPage() {
  const [s, setS] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try { setS(await adminApi.getSettings()); }
    catch { toast.error("Failed"); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    setSaving(true);
    try { await adminApi.updateSettings(s); toast.success("Settings saved"); }
    catch { toast.error("Save failed"); }
    finally { setSaving(false); }
  };

  if (loading || !s) return <AdminLayout title="Loading..."><div className="py-16 text-center"><Loader2 className="inline animate-spin"/></div></AdminLayout>;

  const field = (k) => ({ value: s[k] || "", onChange: (e) => setS({ ...s, [k]: e.target.value }) });
  const numField = (k) => ({ value: s[k] ?? "", onChange: (e) => setS({ ...s, [k]: Number(e.target.value) }), type: "number" });

  return (
    <AdminLayout
      title="Settings"
      subtitle="Site-wide settings, pickup address for Shiprocket, and default package dimensions."
      actions={<Button onClick={save} disabled={saving} data-testid="settings-save-button">{saving ? <Loader2 size={14} className="animate-spin mr-2"/> : <Save size={14} className="mr-2"/>}Save</Button>}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 max-w-5xl">
        <div className="luxury-card p-5">
          <div className="section-label mb-4">Brand</div>
          <div className="space-y-3">
            <div><Label>Brand name</Label><Input {...field("brand_name")}/></div>
            <div><Label>Tagline</Label><Input {...field("tagline")}/></div>
          </div>
        </div>
        <div className="luxury-card p-5">
          <div className="section-label mb-4">Contact</div>
          <div className="space-y-3">
            <div><Label>Contact email</Label><Input {...field("contact_email")}/></div>
            <div><Label>Contact phone</Label><Input {...field("contact_phone")}/></div>
            <div><Label>WhatsApp</Label><Input {...field("whatsapp")}/></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Instagram</Label><Input {...field("instagram")}/></div>
              <div><Label>Facebook</Label><Input {...field("facebook")}/></div>
            </div>
          </div>
        </div>
        <div className="luxury-card p-5 lg:col-span-2">
          <div className="section-label mb-4">Pickup address (Shiprocket)</div>
          <p className="text-xs text-[hsl(var(--muted-foreground))] mb-4">Name must match exactly the pickup location configured in Shiprocket dashboard. Currently: <code className="font-mono text-[11px]">Primary</code> at pincode 201301.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div><Label>Pickup location name</Label><Input {...field("pickup_location_name")}/></div>
            <div><Label>Pincode</Label><Input {...field("pickup_pincode")}/></div>
            <div className="md:col-span-2"><Label>Address</Label><Input {...field("pickup_address")}/></div>
            <div><Label>City</Label><Input {...field("pickup_city")}/></div>
            <div><Label>State</Label><Input {...field("pickup_state")}/></div>
            <div><Label>Country</Label><Input {...field("pickup_country")}/></div>
            <div><Label>Pickup phone</Label><Input {...field("pickup_phone")}/></div>
          </div>
        </div>
        <div className="luxury-card p-5 lg:col-span-2">
          <div className="section-label mb-4">Default package</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div><Label>Weight (kg)</Label><Input {...numField("default_package_weight_kg")} step="0.1"/></div>
            <div><Label>Length (cm)</Label><Input {...numField("default_package_length_cm")}/></div>
            <div><Label>Breadth (cm)</Label><Input {...numField("default_package_breadth_cm")}/></div>
            <div><Label>Height (cm)</Label><Input {...numField("default_package_height_cm")}/></div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
