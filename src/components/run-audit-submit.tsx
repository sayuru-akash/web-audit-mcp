"use client";

import { Activity } from "lucide-react";
import { useFormStatus } from "react-dom";

export function RunAuditSubmit() {
  const { pending } = useFormStatus();
  return (
    <button className="primary" type="submit" disabled={pending} aria-live="polite">
      <Activity size={16} /> {pending ? "Checking..." : "Run audit"}
    </button>
  );
}
