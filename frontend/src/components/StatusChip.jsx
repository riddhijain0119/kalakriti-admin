import React from "react";

const MAP = {
  NEW: "bg-[rgba(201,168,76,0.18)] text-[hsl(var(--primary))] border-[rgba(201,168,76,0.45)]",
  PAYMENT_RECEIVED: "bg-[rgba(43,111,122,0.12)] text-[hsl(var(--info))] border-[rgba(43,111,122,0.3)]",
  ASSIGNED: "bg-[rgba(156,136,120,0.14)] text-[hsl(var(--primary))] border-[rgba(156,136,120,0.3)]",
  IN_PROGRESS: "bg-[rgba(43,111,122,0.12)] text-[hsl(var(--info))] border-[rgba(43,111,122,0.3)]",
  DRAFT_SHARED: "bg-[rgba(199,124,46,0.14)] text-[hsl(var(--warning))] border-[rgba(199,124,46,0.3)]",
  REVISIONS: "bg-[rgba(199,124,46,0.14)] text-[hsl(var(--warning))] border-[rgba(199,124,46,0.3)]",
  APPROVED: "bg-[rgba(47,107,79,0.14)] text-[hsl(var(--success))] border-[rgba(47,107,79,0.3)]",
  PRINTING: "bg-[rgba(43,111,122,0.16)] text-[hsl(var(--info))] border-[rgba(43,111,122,0.35)]",
  SHIPPED: "bg-[rgba(47,107,79,0.20)] text-[hsl(var(--success))] border-[rgba(47,107,79,0.40)]",
  DELIVERED: "bg-[rgba(47,107,79,0.28)] text-[hsl(var(--success))] border-[rgba(47,107,79,0.5)]",
  CANCELLED: "bg-[rgba(194,65,58,0.12)] text-[hsl(var(--destructive))] border-[rgba(194,65,58,0.3)]",
  REFUNDED: "bg-[rgba(194,65,58,0.14)] text-[hsl(var(--destructive))] border-[rgba(194,65,58,0.35)]",
};

const LABELS = {
  NEW: "New",
  PAYMENT_RECEIVED: "Paid",
  ASSIGNED: "Assigned",
  IN_PROGRESS: "In Progress",
  DRAFT_SHARED: "Draft Shared",
  REVISIONS: "Revisions",
  APPROVED: "Approved",
  PRINTING: "Printing",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded",
};

export const StatusChip = ({ status, className = "" }) => {
  const cls = MAP[status] || MAP.NEW;
  return (
    <span data-testid="status-chip" className={`status-chip border ${cls} ${className}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {LABELS[status] || status}
    </span>
  );
};
