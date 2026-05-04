"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function DeleteInvestmentButton({ id }: { id: number }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    if (!window.confirm("Apagar este investimento?")) return;
    setLoading(true);
    try {
      await fetch(`/api/investments/${id}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={loading}
      className="dashboard-button dashboard-button--ghost dashboard-button--sm"
      style={{ color: "#dc2626" }}
    >
      {loading ? "..." : "Apagar"}
    </button>
  );
}
