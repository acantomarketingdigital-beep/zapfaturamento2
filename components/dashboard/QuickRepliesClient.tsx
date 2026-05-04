"use client";

import { useState, useEffect } from "react";
import type { QuickReply } from "@/lib/whatsapp-connections";

type EditState = {
  id: string | null;
  title: string;
  category: string;
  message: string;
};

const EMPTY_EDIT: EditState = { id: null, title: "", category: "Geral", message: "" };

export function QuickRepliesClient() {
  const [replies, setReplies] = useState<QuickReply[]>([]);
  const [loading, setLoading] = useState(true);
  const [edit, setEdit] = useState<EditState | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/whatsapp/quick-replies");
      const data = (await res.json()) as { replies?: QuickReply[] };
      setReplies(data.replies ?? []);
    } catch {}
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleSave() {
    if (!edit) return;
    if (!edit.title.trim() || !edit.message.trim()) {
      setError("Titulo e mensagem sao obrigatorios.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const isNew = !edit.id;
      const url = isNew ? "/api/whatsapp/quick-replies" : `/api/whatsapp/quick-replies/${edit.id}`;
      const method = isNew ? "POST" : "PUT";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: edit.title, category: edit.category, message: edit.message })
      });
      if (!res.ok) {
        const d = (await res.json()) as { error?: string };
        setError(d.error ?? "Erro ao salvar.");
      } else {
        setEdit(null);
        await load();
      }
    } catch {
      setError("Erro ao salvar.");
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Excluir esta resposta rapida?")) return;
    setDeleting(id);
    try {
      await fetch(`/api/whatsapp/quick-replies/${id}`, { method: "DELETE" });
      await load();
    } catch {}
    setDeleting(null);
  }

  const categories = [...new Set(replies.map((r) => r.category))].sort();

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
        <button
          className="dashboard-button"
          onClick={() => setEdit(EMPTY_EDIT)}
        >
          + Nova resposta
        </button>
      </div>

      {edit && (
        <article className="dashboard-card" style={{ marginBottom: 16, padding: "1.25rem" }}>
          <h3 style={{ fontWeight: 600, fontSize: "0.9rem", marginBottom: 12 }}>
            {edit.id ? "Editar resposta" : "Nova resposta rapida"}
          </h3>
          {error && (
            <p style={{ color: "var(--error, #ef4444)", fontSize: "0.8rem", marginBottom: 8 }}>{error}</p>
          )}
          <div className="dashboard-form-grid">
            <label className="dashboard-field">
              <span>Titulo</span>
              <input
                type="text"
                placeholder="Ex: Ola, como posso ajudar?"
                value={edit.title}
                onChange={(e) => setEdit({ ...edit, title: e.target.value })}
              />
            </label>
            <label className="dashboard-field">
              <span>Categoria</span>
              <input
                type="text"
                placeholder="Ex: Saudacao, Orcamento, Agendamento..."
                value={edit.category}
                onChange={(e) => setEdit({ ...edit, category: e.target.value })}
              />
            </label>
            <label className="dashboard-field dashboard-field--full">
              <span>Mensagem</span>
              <textarea
                rows={4}
                placeholder="Texto da mensagem..."
                value={edit.message}
                onChange={(e) => setEdit({ ...edit, message: e.target.value })}
                style={{ resize: "vertical" }}
              />
            </label>
          </div>
          <div className="dashboard-actions" style={{ marginTop: 12 }}>
            <button className="dashboard-button" onClick={handleSave} disabled={saving}>
              {saving ? "Salvando..." : "Salvar"}
            </button>
            <button className="dashboard-button dashboard-button--ghost" onClick={() => { setEdit(null); setError(""); }}>
              Cancelar
            </button>
          </div>
        </article>
      )}

      {loading ? (
        <p style={{ fontSize: "0.85rem", color: "var(--muted)" }}>Carregando...</p>
      ) : replies.length === 0 ? (
        <p style={{ fontSize: "0.85rem", color: "var(--muted)" }}>Nenhuma resposta rapida cadastrada.</p>
      ) : (
        categories.map((cat) => (
          <div key={cat} style={{ marginBottom: 20 }}>
            <div className="dashboard-section-divider" style={{ marginBottom: 8 }}>
              <span>{cat}</span>
            </div>
            {replies.filter((r) => r.category === cat).map((reply) => (
              <article key={reply.id} className="dashboard-card" style={{ marginBottom: 8, padding: "1rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: "0.88rem", marginBottom: 4 }}>{reply.title}</div>
                    <div style={{ fontSize: "0.82rem", color: "var(--muted)", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                      {reply.message}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                    <button
                      className="dashboard-button dashboard-button--ghost"
                      style={{ fontSize: "0.75rem", height: 28, padding: "0 10px" }}
                      onClick={() => setEdit({ id: reply.id, title: reply.title, category: reply.category, message: reply.message })}
                    >
                      Editar
                    </button>
                    <button
                      className="dashboard-button dashboard-button--ghost"
                      style={{ fontSize: "0.75rem", height: 28, padding: "0 10px", color: "var(--error, #ef4444)" }}
                      onClick={() => handleDelete(reply.id)}
                      disabled={deleting === reply.id}
                    >
                      {deleting === reply.id ? "..." : "Excluir"}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ))
      )}
    </div>
  );
}
