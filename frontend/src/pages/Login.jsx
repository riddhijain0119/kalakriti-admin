import React, { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast, Toaster } from "sonner";
import { Sparkles, ShieldCheck, Zap, Loader2 } from "lucide-react";

export default function LoginPage() {
  const { admin, login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("admin@kalakriti.in");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  if (admin) return <Navigate to="/dashboard" replace />;

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email.trim(), password);
      toast.success("Welcome back");
      nav("/dashboard");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-[hsl(var(--background))]">
      <Toaster position="top-right" richColors />
      {/* Brand panel */}
      <div className="hidden lg:flex relative items-center justify-center p-12 bg-[hsl(var(--primary))] overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]" style={{backgroundImage: 'radial-gradient(circle at 30% 30%, rgba(201,168,76,0.6), transparent 55%), radial-gradient(circle at 70% 70%, rgba(156,136,120,0.4), transparent 60%)'}} />
        <div className="relative max-w-md text-[hsl(var(--primary-foreground))] space-y-8">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-md bg-[hsl(var(--accent))] text-[hsl(var(--primary))] flex items-center justify-center">
              <Sparkles size={20} />
            </div>
            <div>
              <div className="font-display text-3xl font-semibold">Kalakriti</div>
              <div className="text-[11px] tracking-widest uppercase text-[hsl(var(--accent))]">Admin Studio</div>
            </div>
          </div>
          <div>
            <h2 className="font-display text-4xl xl:text-5xl font-semibold leading-[1.1] tracking-tight">
              Manage commissions, content, and shipping — <em className="text-[hsl(var(--accent))] italic">calmly.</em>
            </h2>
            <p className="mt-5 text-[hsl(var(--primary-foreground))]/70 leading-relaxed">
              The owner's console for kalakritishop.in. Edit listings, price
              your mediums, approve artist drafts, and ship to your customers
              — from one calm, gallery-grade interface.
            </p>
          </div>
          <div className="space-y-3 pt-4 border-t border-[hsl(var(--primary-foreground))]/10">
            <div className="flex items-center gap-3 text-sm">
              <ShieldCheck size={16} className="text-[hsl(var(--accent))]" />
              <span className="text-[hsl(var(--primary-foreground))]/80">Secure single-admin access</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Zap size={16} className="text-[hsl(var(--accent))]" />
              <span className="text-[hsl(var(--primary-foreground))]/80">Ship with Shiprocket in one click</span>
            </div>
          </div>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-9 h-9 rounded-md bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] flex items-center justify-center">
              <Sparkles size={18} />
            </div>
            <div className="font-display text-2xl font-semibold text-[hsl(var(--primary))]">Kalakriti</div>
          </div>
          <div className="mb-8">
            <div className="section-label mb-2">Sign in</div>
            <h1 className="font-display text-3xl font-semibold text-[hsl(var(--primary))]">Welcome back</h1>
            <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
              Enter your credentials to access the admin console.
            </p>
          </div>
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                data-testid="login-email-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@kalakriti.in"
                autoComplete="email"
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                data-testid="login-password-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
            </div>
            <Button
              type="submit"
              data-testid="login-submit-button"
              className="w-full h-11"
              disabled={loading}
            >
              {loading ? <><Loader2 className="animate-spin mr-2" size={16}/> Signing in...</> : "Sign in"}
            </Button>
          </form>
          <p className="mt-8 text-xs text-[hsl(var(--muted-foreground))] text-center">
            Default credentials: <code className="font-mono text-[11px] bg-[hsl(var(--secondary))] px-1.5 py-0.5 rounded">admin@kalakriti.in</code>
            <span className="mx-1.5">/</span>
            <code className="font-mono text-[11px] bg-[hsl(var(--secondary))] px-1.5 py-0.5 rounded">Kalakriti@2026</code>
          </p>
        </div>
      </div>
    </div>
  );
}
