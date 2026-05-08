"use client";

import { useState } from "react";

type SavedNumber = { id: number; phone_number: string; label: string };

type Props = {
  clientSlug: string;
  initialNumbers: SavedNumber[];
};

export function WhatsAppNumbersManager({ clientSlug, initialNumbers }: Props) {
  const [numbers, setNumbers] = useState<SavedNumber[]>(initialNumbers);
  const [phone, setPhone] = useState("");
  const [label, setLabel] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleAdd() {
    const cleaned = phone.replace(/\D/g, "");
    if (!cleaned) { setError("Informe um numero valido."); return; }
    setError("");
    setSaving(true);
    try {
      const res = await fetch(`/api/clients/${encodeURIComponent(clientSlug)}/whatsapp-numbers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone_number: cleaned, label: label.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Erro ao salvar."); return; }
      setNumbers((prev) => {
        const existing = prev.findIndex((n) => n.id === data.number.id);
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = data.number;
          return updated;
        }
        return [...prev, data.number];
      });
      setPhone("");
      setLabel("");
    } catch {
      setError("Erro de rede.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    try {
      await fetch(
        `/api/clients/${encodeURIComponent(clientSlug)}/whatsapp-numbers?id=${id}`,
        { method: "DELETE" }
      );
      setNumbers((prev) => prev.filter((n) => n.id !== id));
    } catch {
      // ignore
    }
  }

  return (
    <article className="dashboard-card">
      <div className="dashboard-card__header">
        <div>
          <h3>Numeros de WhatsApp</h3>
          <p className="dashboard-helper">
            Cadastre os numeros usados nas campanhas deste cliente. Eles aparecerao como opcao rapida ao criar ou editar campanhas.
          </p>
        </div>
      </div>

      {numbers.length > 0 ? (
        <div className="dashboard-summary-list" style={{ marginBottom: 16 }}>
          {numbers.map((n) => (
            <div key={n.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ flex: 1 }}>
                <strong>{n.phone_number}</strong>
                {n.label ? <span className="dashboard-helper" style={{ marginLeft: 6 }}>{n.label}</span> : null}
              </span>
              <button
                type="button"
                className="dashboard-button dashboard-button--ghost"
                style={{ fontSize: "0.8rem", padding: "2px 10px" }}
                onClick={() => handleDelete(n.id)}
              >
                Remover
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="dashboard-empty" style={{ marginBottom: 16 }}>
          Nenhum numero cadastrado ainda.
        </div>
      )}

      <div className="dashboard-form-stack">
        <div className="dashboard-inline-actions" style={{ alignItems: "flex-end", flexWrap: "wrap" }}>
          <div className="dashboard-field" style={{ flex: "1 1 180px", margin: 0 }}>
            <span>Numero (somente digitos)</span>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="5511999999999"
            />
          </div>
          <div className="dashboard-field" style={{ flex: "1 1 180px", margin: 0 }}>
            <span>Etiqueta (opcional)</span>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Ex.: Implante, Estetica"
            />
          </div>
          <button
            type="button"
            className="dashboard-button"
            onClick={handleAdd}
            disabled={saving}
            style={{ alignSelf: "flex-end" }}
          >
            {saving ? "Salvando..." : "Adicionar"}
          </button>
        </div>
        {error ? <div className="dashboard-alert dashboard-alert--error">{error}</div> : null}
      </div>
    </article>
  );
}
