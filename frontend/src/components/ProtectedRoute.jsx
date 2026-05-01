import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";

export const ProtectedRoute = ({ children }) => {
  const { admin, loading } = useAuth();
  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--background))]">
        <Loader2 className="animate-spin text-[hsl(var(--muted-foreground))]" />
      </div>
    );
  if (!admin) return <Navigate to="/login" replace />;
  return children;
};
