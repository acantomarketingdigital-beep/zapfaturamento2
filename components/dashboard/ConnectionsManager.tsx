"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ConnectionUser, WhatsappConnection } from "@/lib/whatsapp-connections";

type Props = {
  initialConnections: WhatsappConnection[];
  isAgencyAdmin: boolean;
  evolutionConfigured: boolean;
  currentUserClientSlug: string | null;
};

type StatusKey = "connected" | "disconnected" | "connecting" | "error";

const STATUS_LABEL: Record<StatusKey, string> = {
  connected: "Conectado",
  disconnected: "Desconectado",
  connecting: "Conectando",
  error: "Erro"
};

const STATUS_CLASS: Record<StatusKey, string> = {
  connected: "conn-badge--connected",
  disconnected: "conn-badge--disconnected",
  connecting: "conn-badge--connecting",
  error: "conn-badge--error"
};

type QRState = {
  open: boolean;
  connectionId: string;
  connectionName: string;
  base64: string | null;
  status: StatusKey | "loading";
  error: string | null;
};

type ResponsaveisState = {
  open: boolean;
  connectionId: string | null;
  users: ConnectionUser[];
  loading: boolean;
};

type SendLinkState = {
  open: boolean;
  connectionId: string;
  connectionName: string;
  phone: string;
  link: string | null;
  sent: boolean;
  loading: boolean;
  error: string;
};

type NewUserForm = {
  user_name: string;
  user_phone: string;
  user_email: string;
  cargo: string;
  can_reconnect: boolean;
  can_view_inbox: boolean;
  can_reply: boolean;
};

const DEFAULT_QR: QRState = {
  open: false,
  connectionId: "",
  connectionName: "",
  base64: null,
  status: "loading",
  error: null
};

const DEFAULT_NEW_USER: NewUserForm = {
  user_name: "",
  user_phone: "",
  user_email: "",
  cargo: "",
  can_reconnect: true,
  can_view_inbox: true,
  can_reply: false
};

function formatDate(iso: string | null) {
  if (!iso) return "-";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo"
  }).format(new Date(iso));
}

function StatusBadge({ status }: { status: string }) {
  const key = (["connected", "disconnected", "connecting", "error"].includes(status)
    ? status
    : "disconnected") as StatusKey;
  return (
    <span className={`conn-badge ${STATUS_CLASS[key]}`}>{STATUS_LABEL[key]}</span>
  );
}

function QRModal({ state, onClose }: { state: QRState; onClose: () => void }) {
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const qrRefreshRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [localState, setLocalState] = useState<QRState>(state);

  const fetchQR = useCallback(async (id: string) => {
    setLocalState((s) => ({ ...s, status: "loading", error: null }));
    try {
      const res = await fetch(`/api/whatsapp/connections/${id}/qr`);
      const data = (await res.json()) as { base64?: string; error?: string };
      if (!res.ok) {
        setLocalState((s) => ({ ...s, status: "error", error: data.error ?? "Erro ao gerar QR" }));
      } else {
        setLocalState((s) => ({
          ...s,
          status: "connecting",
          base64: data.base64 ?? null,
          error: null
        }));
      }
    } catch {
      setLocalState((s) => ({ ...s, status: "error", error: "Erro de rede" }));
    }
  }, []);

  const pollStatus = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/whatsapp/connections/${id}/status`);
      const data = (await res.json()) as { status?: string };
      if (data.status === "connected") {
        setLocalState((s) => ({ ...s, status: "connected" }));
      }
    } catch {
      // ignore polling errors
    }
  }, []);

  useEffect(() => {
    if (!state.open || !state.connectionId) return;
    setLocalState(state);

    fetchQR(state.connectionId);

    pollRef.current = setInterval(() => pollStatus(state.connectionId), 3000);
    qrRefreshRef.current = setInterval(() => fetchQR(state.connectionId), 30000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (qrRefreshRef.current) clearInterval(qrRefreshRef.current);
    };
  }, [state.open, state.connectionId, fetchQR, pollStatus]);

  useEffect(() => {
    if (localState.status === "connected") {
      if (pollRef.current) clearInterval(pollRef.current);
      if (qrRefreshRef.current) clearInterval(qrRefreshRef.current);
      setTimeout(onClose, 2500);
    }
  }, [localState.status, onClose]);

  if (!state.open) return null;

  return (
    <div className="qr-overlay" onClick={onClose}>
      <div className="qr-modal" onClick={(e) => e.stopPropagation()}>
        <div className="qr-modal__header">
          <div>
            <strong>{state.connectionName}</strong>
            <div style={{ fontSize: "0.78rem", color: "#64748B", marginTop: 2 }}>
              Escaneie com WhatsApp Business
            </div>
          </div>
          <button className="qr-modal__close" onClick={onClose} aria-label="Fechar">✕</button>
        </div>

        <div className="qr-modal__body">
          {localState.status === "loading" && (
            <div className="qr-modal__loading">Gerando QR Code...</div>
          )}

          {localState.status === "error" && (
            <div className="dashboard-alert dashboard-alert--error">
              {localState.error}
              <br />
              <button
                className="dashboard-button dashboard-button--ghost"
                style={{ marginTop: 10, fontSize: "0.8rem", height: 32 }}
                onClick={() => fetchQR(state.connectionId)}
              >
                Tentar novamente
              </button>
            </div>
          )}

          {localState.status === "connected" && (
            <div className="qr-modal__success">
              <div className="qr-modal__success-icon">✓</div>
              <strong>WhatsApp conectado!</strong>
              <p>A conexao foi estabelecida com sucesso.</p>
            </div>
          )}

          {(localState.status === "connecting" || localState.status === "disconnected") &&
            localState.base64 && (
              <div className="qr-modal__qr">
                <img
                  src={localState.base64}
                  alt="QR Code WhatsApp"
                  className="qr-image"
                />
                <p className="qr-modal__hint">
                  Abra o WhatsApp Business → Aparelhos conectados → Conectar aparelho
                </p>
                <p className="qr-modal__refresh-note">QR Code atualiza automaticamente a cada 30s</p>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}

export function ConnectionsManager({
  initialConnections,
  isAgencyAdmin,
  evolutionConfigured,
  currentUserClientSlug
}: Props) {
  const [connections, setConnections] = useState<WhatsappConnection[]>(initialConnections);
  const [qrState, setQRState] = useState<QRState>(DEFAULT_QR);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState(currentUserClientSlug ?? "");
  const [clients, setClients] = useState<{ slug: string; name: string }[]>([]);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState("");
  const [disconnecting, setDisconnecting] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<Record<string, string>>({});
  const [copyLinkResult, setCopyLinkResult] = useState<Record<string, { state: "copying" | "copied" | "error"; link?: string }>>({});
  const [notifyToggling, setNotifyToggling] = useState<string | null>(null);
  const [responsaveis, setResponsaveis] = useState<ResponsaveisState>({
    open: false,
    connectionId: null,
    users: [],
    loading: false
  });
  const [newUser, setNewUser] = useState<NewUserForm>(DEFAULT_NEW_USER);
  const [addingUser, setAddingUser] = useState(false);
  const [sendLink, setSendLink] = useState<SendLinkState>({
    open: false,
    connectionId: "",
    connectionName: "",
    phone: "",
    link: null,
    sent: false,
    loading: false,
    error: ""
  });

  const refreshConnections = useCallback(async () => {
    try {
      const slug = isAgencyAdmin ? "" : (currentUserClientSlug ?? "");
      const url = slug
        ? `/api/whatsapp/connections?client_slug=${encodeURIComponent(slug)}`
        : "/api/whatsapp/connections";
      const res = await fetch(url);
      const data = (await res.json()) as { connections?: WhatsappConnection[] };
      if (data.connections) setConnections(data.connections);
    } catch {
      // ignore
    }
  }, [isAgencyAdmin, currentUserClientSlug]);

  const loadClients = useCallback(async () => {
    try {
      const res = await fetch("/api/clients");
      const data = (await res.json()) as { clients?: { slug: string; name: string }[] };
      if (data.clients) setClients(data.clients);
    } catch {}
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) { setCreateError("Informe o nome da conexao."); return; }
    if (isAgencyAdmin && !newSlug) { setCreateError("Selecione um cliente."); return; }
    if (!isAgencyAdmin && !currentUserClientSlug) return;
    setCreateLoading(true);
    setCreateError("");

    try {
      const res = await fetch("/api/whatsapp/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_slug: isAgencyAdmin ? newSlug.trim() : currentUserClientSlug,
          connection_name: newName.trim()
        })
      });
      const data = (await res.json()) as { connection?: WhatsappConnection; error?: string };
      if (!res.ok) {
        setCreateError(data.error ?? "Erro ao criar conexao.");
      } else if (data.connection) {
        setCreating(false);
        setNewName("");
        setNewSlug(currentUserClientSlug ?? "");
        await refreshConnections();
        // Auto-open QR modal for the new connection
        if (evolutionConfigured) {
          setQRState({
            open: true,
            connectionId: data.connection.id,
            connectionName: data.connection.connection_name,
            base64: null,
            status: "loading",
            error: null
          });
        }
      }
    } catch {
      setCreateError("Erro de rede.");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDisconnect = async (id: string) => {
    if (!confirm("Desconectar e excluir esta conexao?")) return;
    setDisconnecting(id);
    try {
      await fetch(`/api/whatsapp/connections/${id}/disconnect`, { method: "POST" });
      await refreshConnections();
    } finally {
      setDisconnecting(null);
    }
  };

  const handleTestStatus = async (id: string) => {
    setTestResult((prev) => ({ ...prev, [id]: "verificando..." }));
    try {
      const res = await fetch(`/api/whatsapp/connections/${id}/status`);
      const data = (await res.json()) as { status?: string; phone_number?: string };
      const label = data.status === "connected"
        ? `Conectado${data.phone_number ? ` (${data.phone_number})` : ""}`
        : (STATUS_LABEL[(data.status as StatusKey) ?? "disconnected"] ?? data.status ?? "?");
      setTestResult((prev) => ({ ...prev, [id]: label }));
    } catch {
      setTestResult((prev) => ({ ...prev, [id]: "Erro de rede" }));
    }
    setTimeout(() => setTestResult((prev) => { const n = { ...prev }; delete n[id]; return n; }), 5000);
  };

  const openResponsaveis = async (connectionId: string) => {
    setResponsaveis({ open: true, connectionId, users: [], loading: true });
    try {
      const res = await fetch(`/api/whatsapp/connection-users?connection_id=${connectionId}`);
      const data = (await res.json()) as { users?: ConnectionUser[] };
      setResponsaveis((s) => ({ ...s, users: data.users ?? [], loading: false }));
    } catch {
      setResponsaveis((s) => ({ ...s, loading: false }));
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.user_name.trim() || !responsaveis.connectionId) return;
    setAddingUser(true);
    try {
      const res = await fetch("/api/whatsapp/connection-users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connection_id: responsaveis.connectionId, ...newUser })
      });
      const data = (await res.json()) as { user?: ConnectionUser };
      if (data.user) {
        setResponsaveis((s) => ({ ...s, users: [...s.users, data.user!] }));
        setNewUser(DEFAULT_NEW_USER);
      }
    } finally {
      setAddingUser(false);
    }
  };

  const handleRemoveUser = async (userId: string) => {
    await fetch(`/api/whatsapp/connection-users/${userId}`, { method: "DELETE" });
    setResponsaveis((s) => ({ ...s, users: s.users.filter((u) => u.id !== userId) }));
  };

  const openSendLink = (conn: WhatsappConnection) => {
    setSendLink({
      open: true,
      connectionId: conn.id,
      connectionName: conn.connection_name,
      phone: "",
      link: null,
      sent: false,
      loading: false,
      error: ""
    });
  };

  const handleSendLink = async () => {
    setSendLink((s) => ({ ...s, loading: true, error: "", link: null, sent: false }));
    try {
      const res = await fetch(`/api/whatsapp/connections/${sendLink.connectionId}/send-link`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: sendLink.phone })
      });
      let data: { link?: string; sent?: boolean; error?: string } = {};
      try { data = (await res.json()) as typeof data; } catch { /* non-JSON response */ }
      if (!res.ok) {
        setSendLink((s) => ({ ...s, loading: false, error: data.error ?? "Erro ao gerar link. Tente novamente." }));
      } else {
        setSendLink((s) => ({ ...s, loading: false, link: data.link ?? null, sent: data.sent ?? false }));
      }
    } catch {
      setSendLink((s) => ({ ...s, loading: false, error: "Erro de conexao. Tente novamente em alguns segundos." }));
    }
  };

  const handleNotifyToggle = async (conn: WhatsappConnection) => {
    setNotifyToggling(conn.id);
    const newValue = !conn.notify_on_disconnect;
    try {
      await fetch(`/api/whatsapp/connections/${conn.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notify_on_disconnect: newValue })
      });
      setConnections((prev) =>
        prev.map((c) => c.id === conn.id ? { ...c, notify_on_disconnect: newValue } : c)
      );
    } finally {
      setNotifyToggling(null);
    }
  };

  const handleCopyLink = async (connId: string) => {
    setCopyLinkResult((prev) => ({ ...prev, [connId]: { state: "copying" } }));
    try {
      const res = await fetch(`/api/whatsapp/connections/${connId}/send-link`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: "" })
      });
      let data: { link?: string; error?: string } = {};
      try { data = (await res.json()) as typeof data; } catch { /* non-JSON */ }
      if (!res.ok || !data.link) {
        setCopyLinkResult((prev) => ({ ...prev, [connId]: { state: "error" } }));
      } else {
        try {
          await navigator.clipboard.writeText(data.link);
        } catch {
          // clipboard failed — still show the link visually
        }
        setCopyLinkResult((prev) => ({ ...prev, [connId]: { state: "copied", link: data.link } }));
      }
    } catch {
      setCopyLinkResult((prev) => ({ ...prev, [connId]: { state: "error" } }));
    }
    setTimeout(() => setCopyLinkResult((prev) => { const n = { ...prev }; delete n[connId]; return n; }), 30000);
  };

  const handleQRClose = useCallback(() => {
    setQRState(DEFAULT_QR);
    refreshConnections();
  }, [refreshConnections]);

  return (
    <>
      <QRModal state={qrState} onClose={handleQRClose} />

      {/* Send Link Modal */}
      {sendLink.open && (
        <div className="qr-overlay" onClick={() => setSendLink((s) => ({ ...s, open: false }))}>
          <div className="qr-modal" style={{ maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
            <div className="qr-modal__header">
              <div>
                <strong>Enviar link de conexao</strong>
                <div style={{ fontSize: "0.78rem", color: "#64748B", marginTop: 2 }}>
                  {sendLink.connectionName}
                </div>
              </div>
              <button
                className="qr-modal__close"
                onClick={() => setSendLink((s) => ({ ...s, open: false }))}
              >
                ✕
              </button>
            </div>
            <div style={{ padding: "20px 24px" }}>
              <p className="dashboard-helper" style={{ marginBottom: 16 }}>
                O cliente recebera um link para escanear o QR Code sem precisar acessar o painel.
                O link expira em 48 horas.
              </p>

              {!sendLink.link ? (
                <>
                  <label className="dashboard-field" style={{ marginBottom: 16 }}>
                    <span>WhatsApp do cliente (opcional)</span>
                    <input
                      type="tel"
                      value={sendLink.phone}
                      onChange={(e) => setSendLink((s) => ({ ...s, phone: e.target.value }))}
                      placeholder="5511999999999 (com DDD e DDI)"
                      style={{ height: 40 }}
                    />
                    <span className="dashboard-helper" style={{ marginTop: 4 }}>
                      Se informado, enviamos a mensagem automaticamente via WhatsApp.
                    </span>
                  </label>

                  {sendLink.error && (
                    <div className="dashboard-alert dashboard-alert--error" style={{ marginBottom: 12 }}>
                      {sendLink.error}
                    </div>
                  )}

                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      className="dashboard-button"
                      style={{ height: 38, fontSize: "0.85rem", flex: 1 }}
                      disabled={sendLink.loading}
                      onClick={handleSendLink}
                    >
                      {sendLink.loading ? "Gerando..." : sendLink.phone ? "Gerar e enviar" : "Gerar link"}
                    </button>
                    <button
                      className="dashboard-button dashboard-button--ghost"
                      style={{ height: 38, fontSize: "0.85rem" }}
                      onClick={() => setSendLink((s) => ({ ...s, open: false }))}
                    >
                      Cancelar
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {sendLink.sent ? (
                    <div className="dashboard-alert dashboard-alert--info" style={{ marginBottom: 12 }}>
                      Mensagem enviada via WhatsApp para {sendLink.phone}.
                    </div>
                  ) : null}

                  {/* Link box */}
                  <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "12px 14px", marginBottom: 12 }}>
                    <div style={{ fontSize: "0.72rem", color: "#64748B", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.04em" }}>Link de conexao</div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <input
                        readOnly
                        value={sendLink.link ?? ""}
                        style={{ flex: 1, height: 36, fontSize: "0.78rem", borderRadius: 6, border: "1px solid #cbd5e1", padding: "0 10px", background: "#fff", cursor: "text" }}
                        onClick={(e) => (e.target as HTMLInputElement).select()}
                      />
                      <button
                        className="dashboard-button dashboard-button--ghost"
                        style={{ height: 36, fontSize: "0.8rem", whiteSpace: "nowrap" }}
                        onClick={() => {
                          void navigator.clipboard.writeText(sendLink.link!).catch(() => {});
                        }}
                      >
                        Copiar
                      </button>
                    </div>
                  </div>

                  {/* WhatsApp share button — shown when phone was provided but auto-send failed */}
                  {!sendLink.sent && sendLink.phone && sendLink.link && (
                    <a
                      href={`https://wa.me/${sendLink.phone.replace(/\D/g, "")}?text=${encodeURIComponent(
                        `Ola! Para conectar o WhatsApp ao *ZapFaturamento*, acesse o link abaixo:\n\n${sendLink.link}\n\nSiga as instrucoes na tela para escanear o QR Code com seu WhatsApp Business.\n\n_O link expira em 48 horas._`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                        height: 42,
                        borderRadius: 8,
                        background: "#25D366",
                        color: "#fff",
                        fontWeight: 600,
                        fontSize: "0.88rem",
                        textDecoration: "none",
                        marginBottom: 10,
                        cursor: "pointer"
                      }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                      Enviar pelo meu WhatsApp
                    </a>
                  )}

                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      className="dashboard-button dashboard-button--ghost"
                      style={{ height: 36, fontSize: "0.82rem" }}
                      onClick={() => setSendLink((s) => ({ ...s, link: null, sent: false, phone: "" }))}
                    >
                      Gerar novo link
                    </button>
                    <button
                      className="dashboard-button"
                      style={{ height: 36, fontSize: "0.82rem" }}
                      onClick={() => setSendLink((s) => ({ ...s, open: false }))}
                    >
                      Fechar
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Responsáveis Modal */}
      {responsaveis.open && (
        <div className="qr-overlay" onClick={() => setResponsaveis((s) => ({ ...s, open: false }))}>
          <div className="qr-modal" style={{ maxWidth: 560 }} onClick={(e) => e.stopPropagation()}>
            <div className="qr-modal__header">
              <strong>Responsaveis pela Conexao</strong>
              <button
                className="qr-modal__close"
                onClick={() => setResponsaveis((s) => ({ ...s, open: false }))}
              >
                ✕
              </button>
            </div>
            <div style={{ padding: "16px 24px", maxHeight: "70vh", overflowY: "auto" }}>
              <p className="dashboard-helper" style={{ marginBottom: 14 }}>
                Pessoas que podem reconectar o WhatsApp quando cair.
              </p>

              {responsaveis.loading ? (
                <div className="dashboard-helper">Carregando...</div>
              ) : (
                <>
                  {responsaveis.users.length > 0 && (
                    <div className="dashboard-table-wrap" style={{ marginBottom: 16 }}>
                      <table className="dashboard-table">
                        <thead>
                          <tr>
                            <th>Nome</th>
                            <th>WhatsApp</th>
                            <th>E-mail</th>
                            <th>Cargo</th>
                            <th>Pode reconectar</th>
                            <th></th>
                          </tr>
                        </thead>
                        <tbody>
                          {responsaveis.users.map((u) => (
                            <tr key={u.id}>
                              <td>{u.user_name}</td>
                              <td>{u.user_phone ?? "-"}</td>
                              <td>{u.user_email ?? "-"}</td>
                              <td>{u.cargo ?? "-"}</td>
                              <td>{u.can_reconnect ? "Sim" : "Nao"}</td>
                              <td>
                                <button
                                  className="dashboard-button dashboard-button--ghost"
                                  style={{ height: 26, fontSize: "0.75rem", color: "#DC2626" }}
                                  onClick={() => handleRemoveUser(u.id)}
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

                  <form onSubmit={handleAddUser} className="dashboard-form-grid">
                    <label className="dashboard-field">
                      <span>Nome *</span>
                      <input
                        value={newUser.user_name}
                        onChange={(e) => setNewUser((s) => ({ ...s, user_name: e.target.value }))}
                        required
                        placeholder="Ex: Maria Secretaria"
                      />
                    </label>
                    <label className="dashboard-field">
                      <span>WhatsApp</span>
                      <input
                        value={newUser.user_phone}
                        onChange={(e) => setNewUser((s) => ({ ...s, user_phone: e.target.value }))}
                        placeholder="5511999999999"
                      />
                    </label>
                    <label className="dashboard-field">
                      <span>E-mail</span>
                      <input
                        type="email"
                        value={newUser.user_email}
                        onChange={(e) => setNewUser((s) => ({ ...s, user_email: e.target.value }))}
                      />
                    </label>
                    <label className="dashboard-field">
                      <span>Cargo</span>
                      <input
                        value={newUser.cargo}
                        onChange={(e) => setNewUser((s) => ({ ...s, cargo: e.target.value }))}
                        placeholder="Ex: Secretaria"
                      />
                    </label>
                    <label className="dashboard-field" style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <input
                        type="checkbox"
                        checked={newUser.can_reconnect}
                        onChange={(e) => setNewUser((s) => ({ ...s, can_reconnect: e.target.checked }))}
                      />
                      <span>Pode reconectar</span>
                    </label>
                    <label className="dashboard-field" style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <input
                        type="checkbox"
                        checked={newUser.can_view_inbox}
                        onChange={(e) => setNewUser((s) => ({ ...s, can_view_inbox: e.target.checked }))}
                      />
                      <span>Pode ver Inbox</span>
                    </label>
                    <label className="dashboard-field" style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <input
                        type="checkbox"
                        checked={newUser.can_reply}
                        onChange={(e) => setNewUser((s) => ({ ...s, can_reply: e.target.checked }))}
                      />
                      <span>Pode responder</span>
                    </label>
                    <div className="dashboard-actions dashboard-field--full">
                      <button
                        type="submit"
                        className="dashboard-button"
                        disabled={addingUser}
                        style={{ height: 36, fontSize: "0.85rem" }}
                      >
                        {addingUser ? "Adicionando..." : "Adicionar responsavel"}
                      </button>
                    </div>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Header actions */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, alignItems: "center" }}>
        <button
          className="dashboard-button"
          onClick={() => { setCreating((v) => !v); loadClients(); }}
          disabled={!evolutionConfigured}
          style={{ height: 36, fontSize: "0.85rem" }}
        >
          + Nova Conexao
        </button>
        {!evolutionConfigured && (
          <span className="dashboard-helper">Configure a Evolution API para ativar.</span>
        )}
      </div>

      {/* New connection form */}
      {creating && (
        <article className="dashboard-card" style={{ marginBottom: 20 }}>
          <div className="dashboard-card__header">
            <h3>Nova Conexao WhatsApp</h3>
          </div>
          <form onSubmit={handleCreate} className="dashboard-form-grid">

            {/* ── Cliente ── */}
            {isAgencyAdmin ? (
              <label className="dashboard-field dashboard-field--full">
                <span>Cliente *</span>
                <select
                  value={newSlug}
                  onChange={(e) => setNewSlug(e.target.value)}
                  style={{ height: 40, borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", padding: "0 10px", fontSize: "0.88rem", background: "var(--bg)", color: "var(--dark)", width: "100%" }}
                >
                  <option value="">Selecione um cliente cadastrado</option>
                  {clients.map((c) => (
                    <option key={c.slug} value={c.slug}>{c.name}</option>
                  ))}
                </select>
                {newSlug && (
                  <span className="dashboard-helper" style={{ marginTop: 4 }}>
                    Slug: {newSlug}
                  </span>
                )}
              </label>
            ) : (
              <input type="hidden" value={currentUserClientSlug ?? ""} readOnly />
            )}

            {/* ── Nome da conexao ── */}
            <label className="dashboard-field dashboard-field--full">
              <span>Nome da conexao *</span>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ex: WhatsApp Principal, Recepcao, Comercial..."
              />
              <span className="dashboard-helper" style={{ marginTop: 6 }}>
                Escolha uma sugestao ou escreva um nome personalizado.
              </span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                {["WhatsApp Principal","Recepcao","Clinica","Consultorio","Empresa","Atendimento","Comercial","Vendas","Suporte","Financeiro","Agendamentos","Pos-venda"].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setNewName(s)}
                    style={{
                      fontSize: "0.75rem",
                      padding: "3px 10px",
                      borderRadius: 999,
                      border: `1px solid ${newName === s ? "var(--brand)" : "var(--border)"}`,
                      background: newName === s ? "rgba(37,211,102,0.1)" : "var(--bg)",
                      color: newName === s ? "var(--brand-dark)" : "var(--muted)",
                      cursor: "pointer",
                      fontFamily: "inherit"
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </label>

            {createError && (
              <div className="dashboard-alert dashboard-alert--error dashboard-field--full">
                {createError}
              </div>
            )}
            <div className="dashboard-actions dashboard-field--full">
              <button
                type="submit"
                className="dashboard-button"
                disabled={createLoading}
                style={{ height: 36, fontSize: "0.85rem" }}
              >
                {createLoading ? "Criando..." : "Criar e conectar"}
              </button>
              <button
                type="button"
                className="dashboard-button dashboard-button--ghost"
                onClick={() => { setCreating(false); setNewName(""); setNewSlug(currentUserClientSlug ?? ""); setCreateError(""); }}
                style={{ height: 36, fontSize: "0.85rem" }}
              >
                Cancelar
              </button>
            </div>
          </form>
        </article>
      )}

      {/* Connections list */}
      {connections.length === 0 ? (
        <div className="dashboard-card">
          <div className="dashboard-empty">
            Nenhuma conexao cadastrada.{" "}
            {evolutionConfigured
              ? 'Clique em "+ Nova Conexao" para comecar.'
              : "Configure a Evolution API primeiro."}
          </div>
        </div>
      ) : (
        <div className="conexoes-grid">
          {connections.map((conn) => (
            <article key={conn.id} className="conexao-card">
              <div className="conexao-card__header">
                <div>
                  <strong className="conexao-card__name">{conn.connection_name}</strong>
                  {isAgencyAdmin && conn.client_name && (
                    <div className="conexao-card__client">{conn.client_name}</div>
                  )}
                  {conn.phone_number && (
                    <div className="conexao-card__phone">{conn.phone_number}</div>
                  )}
                </div>
                <StatusBadge status={conn.status} />
              </div>

              <div className="conexao-card__meta">
                <span>Conectado: {formatDate(conn.last_connected_at)}</span>
                {conn.status === "disconnected" && (
                  <span>Desconectado: {formatDate(conn.last_disconnected_at)}</span>
                )}
              </div>

              {testResult[conn.id] && (
                <div className="dashboard-notice dashboard-notice--info" style={{ marginTop: 8, fontSize: "0.78rem" }}>
                  Status ao vivo: {testResult[conn.id]}
                </div>
              )}

              <label
                style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10, cursor: "pointer", userSelect: "none", fontSize: "0.78rem", color: "var(--muted)" }}
              >
                <input
                  type="checkbox"
                  checked={conn.notify_on_disconnect}
                  disabled={notifyToggling === conn.id}
                  onChange={() => handleNotifyToggle(conn)}
                  style={{ accentColor: "var(--brand)", width: 14, height: 14 }}
                />
                Avisar no WhatsApp ao desconectar
              </label>

              <div className="conexao-card__actions">
                <button
                  className="dashboard-button"
                  style={{ height: 32, fontSize: "0.78rem" }}
                  disabled={!evolutionConfigured}
                  onClick={() =>
                    setQRState({
                      open: true,
                      connectionId: conn.id,
                      connectionName: conn.connection_name,
                      base64: null,
                      status: "loading",
                      error: null
                    })
                  }
                >
                  {conn.status === "connected" ? "Novo QR Code" : "Conectar / QR Code"}
                </button>
                <button
                  className="dashboard-button dashboard-button--ghost"
                  style={{ height: 32, fontSize: "0.78rem" }}
                  onClick={() => handleTestStatus(conn.id)}
                >
                  Testar status
                </button>
                <button
                  className="dashboard-button dashboard-button--ghost"
                  style={{
                    height: 32,
                    fontSize: "0.78rem",
                    color: copyLinkResult[conn.id]?.state === "copied" ? "#16a34a" : copyLinkResult[conn.id]?.state === "error" ? "#DC2626" : undefined,
                    borderColor: copyLinkResult[conn.id]?.state === "copied" ? "#86efac" : copyLinkResult[conn.id]?.state === "error" ? "#FCA5A5" : undefined
                  }}
                  disabled={copyLinkResult[conn.id]?.state === "copying"}
                  onClick={() => handleCopyLink(conn.id)}
                >
                  {copyLinkResult[conn.id]?.state === "copying" ? "Gerando..." : copyLinkResult[conn.id]?.state === "copied" ? "Link copiado!" : copyLinkResult[conn.id]?.state === "error" ? "Erro ao gerar" : "Copiar link cliente"}
                </button>
                {copyLinkResult[conn.id]?.state === "copied" && copyLinkResult[conn.id]?.link && (
                  <div style={{ marginTop: 6, display: "flex", gap: 6, alignItems: "center" }}>
                    <input
                      readOnly
                      value={copyLinkResult[conn.id]!.link}
                      style={{ flex: 1, height: 30, fontSize: "0.7rem", borderRadius: 6, border: "1px solid #86efac", padding: "0 8px", background: "#f0fdf4", color: "#166534" }}
                      onClick={(e) => (e.target as HTMLInputElement).select()}
                    />
                    <button
                      className="dashboard-button dashboard-button--ghost"
                      style={{ height: 30, fontSize: "0.72rem", whiteSpace: "nowrap", color: "#16a34a", borderColor: "#86efac" }}
                      onClick={() => void navigator.clipboard.writeText(copyLinkResult[conn.id]!.link!)}
                    >
                      Copiar
                    </button>
                  </div>
                )}
                <button
                  className="dashboard-button dashboard-button--ghost"
                  style={{ height: 32, fontSize: "0.78rem" }}
                  onClick={() => openSendLink(conn)}
                >
                  Enviar via WhatsApp
                </button>
                <button
                  className="dashboard-button dashboard-button--ghost"
                  style={{ height: 32, fontSize: "0.78rem" }}
                  onClick={() => openResponsaveis(conn.id)}
                >
                  Responsaveis
                </button>
                <button
                  className="dashboard-button dashboard-button--ghost"
                  style={{ height: 32, fontSize: "0.78rem", color: "#DC2626", borderColor: "#FCA5A5" }}
                  disabled={disconnecting === conn.id}
                  onClick={() => handleDisconnect(conn.id)}
                >
                  {disconnecting === conn.id ? "Removendo..." : "Desconectar"}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
