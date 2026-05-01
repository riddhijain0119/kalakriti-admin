import React, { useRef, useState } from "react";
import { adminApi } from "@/api";
import { toast } from "sonner";
import { UploadCloud, Loader2, X, ImagePlus, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * ImageUpload — drag-drop or click-to-upload, with URL paste fallback.
 *
 * Props:
 *   value (string URL) — current image URL
 *   onChange (string URL) — called with new URL
 *   label (string)
 *   aspect ("square" | "4/3" | "16/9" | "auto") — display ratio
 *   testid (string)
 */
export const ImageUpload = ({ value, onChange, label = "Image", aspect = "4/3", testid = "image-upload" }) => {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlDraft, setUrlDraft] = useState(value || "");
  const inputRef = useRef();

  const doUpload = async (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file (JPG, PNG, WebP, GIF).");
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      toast.error("Image too large (max 15 MB).");
      return;
    }
    setUploading(true);
    try {
      const res = await adminApi.uploadImage(file);
      onChange(res.url);
      toast.success("Image uploaded");
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const onPick = (e) => {
    const f = e.target.files?.[0];
    if (f) doUpload(f);
    e.target.value = "";
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) doUpload(f);
  };

  const aspectClass = {
    "square": "aspect-square",
    "4/3": "aspect-[4/3]",
    "16/9": "aspect-[16/9]",
    "auto": "",
  }[aspect] || "aspect-[4/3]";

  const applyUrl = () => {
    if (!urlDraft) return;
    onChange(urlDraft.trim());
    setShowUrlInput(false);
    toast.success("URL applied");
  };

  const clear = () => {
    onChange("");
    setUrlDraft("");
  };

  return (
    <div className="space-y-2" data-testid={testid}>
      {label && <div className="text-sm font-medium text-[hsl(var(--primary))]">{label}</div>}
      {value ? (
        <div className="relative group">
          <div className={`relative ${aspectClass} bg-[hsl(var(--secondary))] rounded-lg overflow-hidden border border-[hsl(var(--border))]`}>
            <img src={value} alt="preview" className="w-full h-full object-cover" onError={(e) => { e.target.style.display = "none"; }} />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
              <Button size="sm" variant="secondary" type="button" onClick={() => inputRef.current?.click()} disabled={uploading}>
                {uploading ? <Loader2 size={14} className="animate-spin mr-1.5" /> : <ImagePlus size={14} className="mr-1.5" />}
                Replace
              </Button>
              <Button size="sm" variant="destructive" type="button" onClick={clear}>
                <X size={14} className="mr-1.5" />Remove
              </Button>
            </div>
          </div>
          <div className="text-[10px] text-[hsl(var(--muted-foreground))] truncate mt-1 font-mono">{value}</div>
        </div>
      ) : (
        <>
          <div
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            className={`${aspectClass} cursor-pointer rounded-lg border-2 border-dashed flex flex-col items-center justify-center p-6 transition-all ${
              dragOver
                ? "border-[hsl(var(--accent))] bg-[rgba(201,168,76,0.12)]"
                : "border-[hsl(var(--border))] bg-[hsl(var(--secondary))]/50 hover:border-[hsl(var(--accent))] hover:bg-[rgba(201,168,76,0.05)]"
            }`}
          >
            {uploading ? (
              <><Loader2 className="animate-spin text-[hsl(var(--accent))] mb-2" /><div className="text-sm text-[hsl(var(--muted-foreground))]">Uploading...</div></>
            ) : (
              <>
                <UploadCloud size={28} className="text-[hsl(var(--muted-foreground))] mb-2" />
                <div className="text-sm font-medium text-[hsl(var(--primary))]">Click to upload or drag & drop</div>
                <div className="text-xs text-[hsl(var(--muted-foreground))] mt-1">JPG, PNG, WebP, GIF &middot; up to 15 MB</div>
              </>
            )}
          </div>
          {!showUrlInput ? (
            <button
              type="button"
              onClick={() => setShowUrlInput(true)}
              className="text-[11px] text-[hsl(var(--accent))] hover:underline flex items-center gap-1 mx-auto"
            >
              <Link2 size={11} /> or paste a URL instead
            </button>
          ) : (
            <div className="flex gap-2">
              <Input value={urlDraft} onChange={(e) => setUrlDraft(e.target.value)} placeholder="https://..." className="h-9 text-xs" />
              <Button size="sm" variant="secondary" type="button" onClick={applyUrl}>Use</Button>
              <Button size="sm" variant="ghost" type="button" onClick={() => setShowUrlInput(false)}>Cancel</Button>
            </div>
          )}
        </>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onPick}
        data-testid={`${testid}-file-input`}
      />
    </div>
  );
};
