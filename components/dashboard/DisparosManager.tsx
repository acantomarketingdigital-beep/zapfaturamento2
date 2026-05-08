"use client";

import { useCallback, useRef, useState } from "react";
import type { CampanhaDisparo, DisparoInstancia, DisparoLog } from "@/lib/disparos";

type SafeInstancia = Omit<DisparoInstancia, "access_token">;

type Props = {
  clientSlug: string;
  isAgencyAdmin: boolean;
  clients: { clientSlug: string; clientName: string }[];
  initialInstancias: SafeInstancia[];
  initialCampanhas: CampanhaDisparo[];
};

type Tab = "campanhas" | "instancias";

type SendProgress = {
  total: number;
  sent: number;
  failed: number;
  done: boolean;
};

// ─── CSV Parser ───────────────────────────────────────────────────────────────

function parseCsv(text: string): { phone: string; name?: string }[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length === 0) return [];

  const firstLine = lines[0].toLowerCase();
  const hasHeader = firstLine.includes("phone") || firstLine.includes("nome") || firstLine.includes("name");
  const dataLines = hasHeader ? lines.slice(1) : lines;

  return dataLines
    .map((line) => {
      const cols = line.split(/[,;\t]/).map((c) => c.trim().replace(/^["']|["']$/g, ""));
      const phone = cols[0] ?? "";
      const name = cols[1] || undefined;
      return { phone, name };
    })
    .filter((c) => c.phone);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: CampanhaDisparo["status"] }) {
  const map: Record<CampanhaDisparo["status"], { label: string; color: string }> = {
    draft: { label: "Rascunho", color: "#6b7280" },
    running: { label: "Enviando...", color: "#f59e0b" },
    paused: { label: "Pausado", color: "#6366f1" },
    done: { label: "Concluido", color: "#10b981" },
    failed: { label: "Falhou", color: "#ef4444" }
  };
  const s = map[status] ?? { label: status, color: "#6b7280" };
  return (
    <span style={{
      display: "inline-block",
      padding: "2px 8px",
      borderRadius: 12,
      fontSize: "0.72rem",
      fontWeight: 600,
      background: s.color + "22",
      color: s.color,
      border: `1px solid ${s.color}44`
    }}>
      {s.label}
    </span>
  );
}

function LogStatusDot({ status }: { status: DisparoLog["status"] }) {
  const colors: Record<DisparoLog["status"], string> = {
    pending: "#9ca3af",
    sent: "#10b981",
    failed: "#ef4444",
    skipped: "#f59e0b"
  };
  return (
    <span style={{
      display: "inline-block",
      width: 8,
      height: 8,
      borderRadius: "50%",
      background: colors[status] ?? "#9ca3af",
      marginRight: 6,
      flexShrink: 0
    }} />
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function DisparosManager({
  clientSlug: initialClientSlug,
  isAgencyAdmin,
  clients,
  initialInstancias,
  initialCampanhas
}: Props) {
  const [tab, setTab] = useState<Tab>("campanhas");
  const [clientSlug, setClientSlug] = useState(initialClientSlug);

  // Instancias state
  const [instancias, setInstancias] = useState<SafeInstancia[]>(initialInstancias);
  const [showInstanciaForm, setShowInstanciaForm] = useState(false);
  const [instanciaForm, setInstanciaForm] = useState({ name: "", phoneNumberId: "", accessToken: "", wabaId: "" });
  const [instanciaLoading, setInstanciaLoading] = useState(false);
  const [instanciaError, setInstanciaError] = useState("");

  // Campanhas state
  const [campanhas, setCampanhas] = useState<CampanhaDisparo[]>(initialCampanhas);
  const [showCampanhaForm, setShowCampanhaForm] = useState(false);
  const [campanhaForm, setCampanhaForm] = useState({ name: "", message: "", instanciaId: "" });
  const [campanhaLoading, setCampanhaLoading] = useState(false);
  const [campanhaError, setCampanhaError] = useState("");

  // Campaign detail / editing
  const [selectedCampanha, setSelectedCampanha] = useState<CampanhaDisparo | null>(null);
  const [editMessage, setEditMessage] = useState("");
  const [editInstanciaId, setEditInstanciaId] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState("");

  // Contacts / logs
  const [logs, setLogs] = useState<DisparoLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [importError, setImportError] = useState("");
  const [importCount, setImportCount] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sending progress (SSE)
  const [progress, setProgress] = useState<SendProgress | null>(null);
  const [sending, setSending] = useState(false);

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  const qs = useCallback((base: string) => {
    const url = new URL(base, window.location.origin);
    if (clientSlug) url.searchParams.set("clientSlug", clientSlug);
    return url.toString();
  }, [clientSlug]);

  const refreshCampanhas = useCallback(async () => {
    const res = await fetch(qs("/api/disparos/campanhas"));
    if (res.ok) {
      const data = await res.json() as { campanhas: CampanhaDisparo[] };
      setCampanhas(data.campanhas);
    }
  }, [qs]);

  const refreshInstancias = useCallback(async () => {
    const res = await fetch(qs("/api/disparos/instancias"));
    if (res.ok) {
      const data = await res.json() as { instancias: SafeInstancia[] };
      setInstancias(data.instancias);
    }
  }, [qs]);

  const loadLogs = useCallback(async (campanhaId: string) => {
    setLogsLoading(true);
    const res = await fetch(qs(`/api/disparos/campanhas/${campanhaId}/contatos`));
    if (res.ok) {
      const data = await res.json() as { logs: DisparoLog[] };
      setLogs(data.logs);
    }
    setLogsLoading(false);
  }, [qs]);

  // ─── Instancia actions ────────────────────────────────────────────────────────

  async function handleCreateInstancia(e: React.FormEvent) {
    e.preventDefault();
    setInstanciaError("");
    setInstanciaLoading(true);

    const res = await fetch("/api/disparos/instancias", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...instanciaForm, clientSlug })
    });

    const data = await res.json() as { instancia?: SafeInstancia; error?: string };

    if (!res.ok) {
      setInstanciaError(data.error ?? "Erro ao criar instancia.");
    } else {
      setInstancias((prev) => [data.instancia!, ...prev]);
      setInstanciaForm({ name: "", phoneNumberId: "", accessToken: "", wabaId: "" });
      setShowInstanciaForm(false);
    }
    setInstanciaLoading(false);
  }

  async function handleDeleteInstancia(id: string) {
    if (!confirm("Remover esta instancia?")) return;
    const res = await fetch(qs(`/api/disparos/instancias/${id}`), { method: "DELETE" });
    if (res.ok) setInstancias((prev) => prev.filter((i) => i.id !== id));
    else {
      const d = await res.json() as { error?: string };
      alert(d.error ?? "Erro ao remover instancia.");
    }
  }

  // ─── Campanha actions ─────────────────────────────────────────────────────────

  async function handleCreateCampanha(e: React.FormEvent) {
    e.preventDefault();
    setCampanhaError("");
    setCampanhaLoading(true);

    const res = await fetch("/api/disparos/campanhas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...campanhaForm, instanciaId: campanhaForm.instanciaId || null, clientSlug })
    });

    const data = await res.json() as { campanha?: CampanhaDisparo; error?: string };

    if (!res.ok) {
      setCampanhaError(data.error ?? "Erro ao criar campanha.");
    } else {
      setCampanhas((prev) => [data.campanha!, ...prev]);
      setCampanhaForm({ name: "", message: "", instanciaId: "" });
      setShowCampanhaForm(false);
    }
    setCampanhaLoading(false);
  }

  async function handleDeleteCampanha(id: string) {
    if (!confirm("Excluir esta campanha? Esta acao nao pode ser desfeita.")) return;
    const res = await fetch(qs(`/api/disparos/campanhas/${id}`), { method: "DELETE" });
    if (res.ok) {
      setCampanhas((prev) => prev.filter((c) => c.id !== id));
      if (selectedCampanha?.id === id) setSelectedCampanha(null);
    } else {
      const d = await res.json() as { error?: string };
      alert(d.error ?? "Erro ao excluir campanha.");
    }
  }

  // ─── Campaign detail ──────────────────────────────────────────────────────────

  function openCampanha(campanha: CampanhaDisparo) {
    setSelectedCampanha(campanha);
    setEditMessage(campanha.message);
    setEditInstanciaId(campanha.instancia_id ?? "");
    setEditError("");
    setImportError("");
    setImportCount(null);
    setProgress(null);
    loadLogs(campanha.id);
  }

  async function handleSaveEdit() {
    if (!selectedCampanha) return;
    setEditSaving(true);
    setEditError("");

    const res = await fetch(qs(`/api/disparos/campanhas/${selectedCampanha.id}`), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: editMessage, instanciaId: editInstanciaId || null })
    });

    if (!res.ok) {
      const d = await res.json() as { error?: string };
      setEditError(d.error ?? "Erro ao salvar.");
    } else {
      const updated = { ...selectedCampanha, message: editMessage, instancia_id: editInstanciaId || null };
      setSelectedCampanha(updated);
      setCampanhas((prev) => prev.map((c) => c.id === updated.id ? updated : c));
    }
    setEditSaving(false);
  }

  // ─── CSV Import ───────────────────────────────────────────────────────────────

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !selectedCampanha) return;

    setImportError("");
    setImportCount(null);

    const text = await file.text();
    const contacts = parseCsv(text);

    if (contacts.length === 0) {
      setImportError("Nenhum contato encontrado no arquivo. Use colunas: phone, name");
      return;
    }

    const res = await fetch(qs(`/api/disparos/campanhas/${selectedCampanha.id}/contatos`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contacts })
    });

    const data = await res.json() as { inserted?: number; error?: string };
    if (!res.ok) {
      setImportError(data.error ?? "Erro ao importar contatos.");
    } else {
      setImportCount(data.inserted ?? 0);
      const updated = { ...selectedCampanha, total_contatos: data.inserted ?? 0, sent: 0, failed: 0 };
      setSelectedCampanha(updated);
      setCampanhas((prev) => prev.map((c) => c.id === updated.id ? updated : c));
      await loadLogs(selectedCampanha.id);
    }

    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  // ─── Send (SSE) ───────────────────────────────────────────────────────────────

  async function handleEnviar() {
    if (!selectedCampanha) return;
    if (!confirm(`Confirmar disparo para ${selectedCampanha.total_contatos} contatos?`)) return;

    setSending(true);
    setProgress({ total: selectedCampanha.total_contatos, sent: 0, failed: 0, done: false });

    const res = await fetch(qs(`/api/disparos/campanhas/${selectedCampanha.id}/enviar`), {
      method: "POST"
    });

    if (!res.ok || !res.body) {
      const d = await res.json().catch(() => ({})) as { error?: string };
      alert(d.error ?? "Erro ao iniciar disparo.");
      setSending(false);
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split("\n\n");
      buffer = parts.pop() ?? "";

      for (const part of parts) {
        const line = part.replace(/^data: /, "").trim();
        if (!line) continue;
        try {
          const event = JSON.parse(line) as {
            type: string;
            total?: number;
            sent?: number;
            failed?: number;
            status?: string;
          };

          if (event.type === "start") {
            setProgress({ total: event.total ?? 0, sent: 0, failed: 0, done: false });
          } else if (event.type === "sent" || event.type === "failed") {
            setProgress({ total: selectedCampanha.total_contatos, sent: event.sent ?? 0, failed: event.failed ?? 0, done: false });
          } else if (event.type === "done") {
            setProgress((p) => p ? { ...p, sent: event.sent ?? p.sent, failed: event.failed ?? p.failed, done: true } : null);
            const finalStatus = (event.status ?? "done") as CampanhaDisparo["status"];
            const updated = { ...selectedCampanha, status: finalStatus, sent: event.sent ?? 0, failed: event.failed ?? 0 };
            setSelectedCampanha(updated);
            setCampanhas((prev) => prev.map((c) => c.id === updated.id ? updated : c));
            await loadLogs(selectedCampanha.id);
          }
        } catch {}
      }
    }

    setSending(false);
  }

  // ─── Render ───────────────────────────────────────────────────────────────────

  if (selectedCampanha) {
    const canEdit = selectedCampanha.status === "draft";
    const canSend = selectedCampanha.status === "draft" && selectedCampanha.total_contatos > 0 && !sending;
    const pendingCount = logs.filter((l) => l.status === "pending").length;
    const sentCount = logs.filter((l) => l.status === "sent").length;
    const failedCount = logs.filter((l) => l.status === "failed").length;

    return (
      <div>
        <button
          className="dashboard-button dashboard-button--ghost"
          style={{ marginBottom: 16 }}
          onClick={() => { setSelectedCampanha(null); refreshCampanhas(); }}
        >
          ← Voltar para campanhas
        </button>

        <article className="dashboard-card">
          <div className="dashboard-card__header">
            <h2>{selectedCampanha.name}</h2>
            <StatusBadge status={selectedCampanha.status} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 20 }}>
            <div className="dashboard-stat-card dashboard-stat-card--neutral">
              <span>Total</span>
              <strong>{selectedCampanha.total_contatos}</strong>
            </div>
            <div className="dashboard-stat-card dashboard-stat-card--success">
              <span>Enviados</span>
              <strong>{progress?.sent ?? selectedCampanha.sent}</strong>
            </div>
            <div className="dashboard-stat-card" style={{ background: "#fef2f2" }}>
              <span style={{ color: "#ef4444" }}>Falhas</span>
              <strong style={{ color: "#ef4444" }}>{progress?.failed ?? selectedCampanha.failed}</strong>
            </div>
          </div>

          {progress && !progress.done && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: "0.85rem", color: "#6b7280", marginBottom: 6 }}>
                Enviando... {progress.sent + progress.failed} de {progress.total}
              </div>
              <div style={{ background: "#e5e7eb", borderRadius: 8, height: 10, overflow: "hidden" }}>
                <div
                  style={{
                    height: "100%",
                    background: "#10b981",
                    width: `${Math.round(((progress.sent + progress.failed) / progress.total) * 100)}%`,
                    transition: "width 0.3s"
                  }}
                />
              </div>
            </div>
          )}

          {progress?.done && (
            <div className="dashboard-banner dashboard-banner--success" style={{ marginBottom: 16 }}>
              Disparo concluido: {progress.sent} enviados, {progress.failed} falhas.
            </div>
          )}

          {canEdit && (
            <>
              <div style={{ marginBottom: 12 }}>
                <label className="dashboard-field" style={{ marginBottom: 8 }}>
                  <span>Instancia (Meta Cloud API)</span>
                  <select
                    value={editInstanciaId}
                    onChange={(e) => setEditInstanciaId(e.target.value)}
                  >
                    <option value="">Selecione uma instancia...</option>
                    {instancias.map((i) => (
                      <option key={i.id} value={i.id}>{i.name} ({i.phone_number_id})</option>
                    ))}
                  </select>
                </label>

                <label className="dashboard-field">
                  <span>Mensagem</span>
                  <textarea
                    rows={5}
                    value={editMessage}
                    onChange={(e) => setEditMessage(e.target.value)}
                    placeholder="Digite a mensagem a ser enviada..."
                    style={{ resize: "vertical" }}
                  />
                </label>

                {editError && <p style={{ color: "#ef4444", fontSize: "0.85rem", marginTop: 4 }}>{editError}</p>}

                <button
                  className="dashboard-button"
                  style={{ marginTop: 8 }}
                  onClick={handleSaveEdit}
                  disabled={editSaving}
                >
                  {editSaving ? "Salvando..." : "Salvar mensagem"}
                </button>
              </div>

              <div className="dashboard-section-divider" style={{ margin: "16px 0" }}>
                <span>Importar contatos</span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 8 }}>
                <label className="dashboard-button dashboard-button--ghost" style={{ cursor: "pointer" }}>
                  Importar CSV
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.txt"
                    style={{ display: "none" }}
                    onChange={handleFileChange}
                  />
                </label>
                <span style={{ fontSize: "0.8rem", color: "#9ca3af" }}>
                  Colunas esperadas: phone, name (opcional)
                </span>
              </div>

              {importError && <p style={{ color: "#ef4444", fontSize: "0.85rem" }}>{importError}</p>}
              {importCount !== null && (
                <p style={{ color: "#10b981", fontSize: "0.85rem" }}>{importCount} contatos importados.</p>
              )}
            </>
          )}

          {selectedCampanha.total_contatos > 0 && (
            <>
              <div className="dashboard-section-divider" style={{ margin: "16px 0" }}>
                <span>Contatos ({selectedCampanha.total_contatos})</span>
              </div>

              {logsLoading ? (
                <p style={{ color: "#9ca3af", fontSize: "0.85rem" }}>Carregando contatos...</p>
              ) : (
                <div style={{ maxHeight: 300, overflowY: "auto", border: "1px solid #e5e7eb", borderRadius: 8 }}>
                  <table className="dashboard-table" style={{ fontSize: "0.8rem" }}>
                    <thead>
                      <tr>
                        <th>Status</th>
                        <th>Telefone</th>
                        <th>Nome</th>
                        <th>Obs</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.length === 0 ? (
                        <tr><td colSpan={4} style={{ textAlign: "center", opacity: 0.5 }}>Nenhum contato.</td></tr>
                      ) : (
                        logs.map((log) => (
                          <tr key={log.id}>
                            <td style={{ display: "flex", alignItems: "center" }}>
                              <LogStatusDot status={log.status} />
                              {log.status}
                            </td>
                            <td>{log.phone}</td>
                            <td>{log.name || "-"}</td>
                            <td style={{ color: "#ef4444", fontSize: "0.75rem" }}>{log.error_msg || ""}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              <div style={{ marginTop: 8, fontSize: "0.8rem", color: "#6b7280" }}>
                Pendentes: {pendingCount} | Enviados: {sentCount} | Falhas: {failedCount}
              </div>
            </>
          )}

          <div style={{ marginTop: 20, display: "flex", gap: 12, flexWrap: "wrap" }}>
            {canSend && (
              <button
                className="dashboard-button"
                style={{ background: "#25D366", borderColor: "#25D366" }}
                onClick={handleEnviar}
                disabled={sending}
              >
                {sending ? "Enviando..." : `Disparar para ${selectedCampanha.total_contatos} contatos`}
              </button>
            )}
            {selectedCampanha.status === "draft" && (
              <button
                className="dashboard-button dashboard-button--danger"
                onClick={() => handleDeleteCampanha(selectedCampanha.id)}
              >
                Excluir campanha
              </button>
            )}
          </div>
        </article>
      </div>
    );
  }

  return (
    <div>
      {isAgencyAdmin && clients.length > 1 && (
        <article className="dashboard-card" style={{ marginBottom: 16 }}>
          <label className="dashboard-field" style={{ maxWidth: 320 }}>
            <span>Cliente</span>
            <select value={clientSlug} onChange={(e) => setClientSlug(e.target.value)}>
              {clients.map((c) => (
                <option key={c.clientSlug} value={c.clientSlug}>{c.clientName}</option>
              ))}
            </select>
          </label>
        </article>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: "2px solid #e5e7eb" }}>
        {(["campanhas", "instancias"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: "8px 20px",
              border: "none",
              background: "none",
              cursor: "pointer",
              fontWeight: tab === t ? 700 : 400,
              color: tab === t ? "#7c3aed" : "#6b7280",
              borderBottom: tab === t ? "2px solid #7c3aed" : "2px solid transparent",
              marginBottom: -2,
              fontSize: "0.9rem"
            }}
          >
            {t === "campanhas" ? "Campanhas" : "Instancias Meta"}
          </button>
        ))}
      </div>

      {/* ── CAMPANHAS TAB ───────────────────────────── */}
      {tab === "campanhas" && (
        <>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
            <button
              className="dashboard-button"
              onClick={() => setShowCampanhaForm(!showCampanhaForm)}
            >
              {showCampanhaForm ? "Cancelar" : "+ Nova campanha"}
            </button>
          </div>

          {showCampanhaForm && (
            <article className="dashboard-card" style={{ marginBottom: 16 }}>
              <div className="dashboard-card__header"><h2>Nova campanha</h2></div>
              <form onSubmit={handleCreateCampanha} className="dashboard-form-grid">
                <label className="dashboard-field">
                  <span>Nome da campanha</span>
                  <input
                    type="text"
                    required
                    value={campanhaForm.name}
                    onChange={(e) => setCampanhaForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Ex: Promocao Maio 2025"
                  />
                </label>

                <label className="dashboard-field">
                  <span>Instancia (opcional)</span>
                  <select
                    value={campanhaForm.instanciaId}
                    onChange={(e) => setCampanhaForm((f) => ({ ...f, instanciaId: e.target.value }))}
                  >
                    <option value="">Selecione depois...</option>
                    {instancias.map((i) => (
                      <option key={i.id} value={i.id}>{i.name}</option>
                    ))}
                  </select>
                </label>

                <label className="dashboard-field dashboard-field--full">
                  <span>Mensagem (opcional — pode editar depois)</span>
                  <textarea
                    rows={4}
                    value={campanhaForm.message}
                    onChange={(e) => setCampanhaForm((f) => ({ ...f, message: e.target.value }))}
                    placeholder="Oi {{nome}}, temos uma novidade especial para voce!"
                  />
                </label>

                {campanhaError && (
                  <p style={{ color: "#ef4444", fontSize: "0.85rem" }} className="dashboard-field--full">{campanhaError}</p>
                )}

                <div className="dashboard-actions dashboard-field--full">
                  <button type="submit" className="dashboard-button" disabled={campanhaLoading}>
                    {campanhaLoading ? "Criando..." : "Criar campanha"}
                  </button>
                </div>
              </form>
            </article>
          )}

          <article className="dashboard-card">
            <div className="dashboard-card__header"><h2>Campanhas</h2></div>
            {campanhas.length === 0 ? (
              <p style={{ textAlign: "center", opacity: 0.5, padding: "24px 0" }}>
                Nenhuma campanha criada. Clique em &ldquo;+ Nova campanha&rdquo; para comecar.
              </p>
            ) : (
              <div className="dashboard-table-wrap">
                <table className="dashboard-table">
                  <thead>
                    <tr>
                      <th>Nome</th>
                      <th>Instancia</th>
                      <th>Status</th>
                      <th>Contatos</th>
                      <th>Enviados</th>
                      <th>Falhas</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {campanhas.map((c) => (
                      <tr key={c.id} style={{ cursor: "pointer" }} onClick={() => openCampanha(c)}>
                        <td><strong>{c.name}</strong></td>
                        <td>{c.instancia_name ?? <span style={{ color: "#9ca3af" }}>–</span>}</td>
                        <td><StatusBadge status={c.status} /></td>
                        <td>{c.total_contatos}</td>
                        <td style={{ color: "#10b981" }}>{c.sent}</td>
                        <td style={{ color: c.failed > 0 ? "#ef4444" : undefined }}>{c.failed}</td>
                        <td>
                          <button
                            className="dashboard-button dashboard-button--ghost"
                            style={{ padding: "4px 12px", fontSize: "0.8rem" }}
                            onClick={(e) => { e.stopPropagation(); openCampanha(c); }}
                          >
                            Abrir
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </article>
        </>
      )}

      {/* ── INSTANCIAS TAB ──────────────────────────── */}
      {tab === "instancias" && (
        <>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
            <button
              className="dashboard-button"
              onClick={() => setShowInstanciaForm(!showInstanciaForm)}
            >
              {showInstanciaForm ? "Cancelar" : "+ Conectar instancia"}
            </button>
          </div>

          {showInstanciaForm && (
            <article className="dashboard-card" style={{ marginBottom: 16 }}>
              <div className="dashboard-card__header"><h2>Conectar Meta Cloud API</h2></div>
              <form onSubmit={handleCreateInstancia} className="dashboard-form-grid">
                <label className="dashboard-field">
                  <span>Nome da instancia</span>
                  <input
                    type="text"
                    required
                    value={instanciaForm.name}
                    onChange={(e) => setInstanciaForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Ex: Principal, Clinica Centro"
                  />
                </label>

                <label className="dashboard-field">
                  <span>Phone Number ID</span>
                  <input
                    type="text"
                    required
                    value={instanciaForm.phoneNumberId}
                    onChange={(e) => setInstanciaForm((f) => ({ ...f, phoneNumberId: e.target.value }))}
                    placeholder="123456789012345"
                  />
                </label>

                <label className="dashboard-field dashboard-field--full">
                  <span>Access Token (token permanente)</span>
                  <input
                    type="password"
                    required
                    value={instanciaForm.accessToken}
                    onChange={(e) => setInstanciaForm((f) => ({ ...f, accessToken: e.target.value }))}
                    placeholder="EAAxxxxxxxxxxxxxxx"
                    autoComplete="new-password"
                  />
                </label>

                <label className="dashboard-field">
                  <span>WABA ID (opcional)</span>
                  <input
                    type="text"
                    value={instanciaForm.wabaId}
                    onChange={(e) => setInstanciaForm((f) => ({ ...f, wabaId: e.target.value }))}
                    placeholder="987654321098765"
                  />
                </label>

                {instanciaError && (
                  <p style={{ color: "#ef4444", fontSize: "0.85rem" }} className="dashboard-field--full">{instanciaError}</p>
                )}

                <div className="dashboard-actions dashboard-field--full">
                  <button type="submit" className="dashboard-button" disabled={instanciaLoading}>
                    {instanciaLoading ? "Salvando..." : "Salvar instancia"}
                  </button>
                </div>
              </form>
            </article>
          )}

          <article className="dashboard-card">
            <div className="dashboard-card__header"><h2>Instancias conectadas</h2></div>
            {instancias.length === 0 ? (
              <p style={{ textAlign: "center", opacity: 0.5, padding: "24px 0" }}>
                Nenhuma instancia configurada. Adicione as credenciais da Meta Cloud API.
              </p>
            ) : (
              <div className="dashboard-table-wrap">
                <table className="dashboard-table">
                  <thead>
                    <tr>
                      <th>Nome</th>
                      <th>Phone Number ID</th>
                      <th>WABA ID</th>
                      <th>Criado em</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {instancias.map((i) => (
                      <tr key={i.id}>
                        <td><strong>{i.name}</strong></td>
                        <td><code style={{ fontSize: "0.78rem" }}>{i.phone_number_id}</code></td>
                        <td>{i.waba_id ?? "–"}</td>
                        <td>{new Date(i.created_at).toLocaleDateString("pt-BR")}</td>
                        <td>
                          <button
                            className="dashboard-button dashboard-button--danger"
                            style={{ padding: "4px 12px", fontSize: "0.8rem" }}
                            onClick={() => handleDeleteInstancia(i.id)}
                          >
                            Remover
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </article>
        </>
      )}
    </div>
  );
}
