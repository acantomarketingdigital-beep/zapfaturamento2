"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { WhatsappConversation, WhatsappMessage, QuickReply } from "@/lib/whatsapp-connections";

type Props = {
  isAgencyAdmin: boolean;
};

const STAGES = [
  { key: "novo_lead", label: "Novo Lead" },
  { key: "primeiro_contato", label: "Primeiro Contato" },
  { key: "em_atendimento", label: "Em Atendimento" },
  { key: "orcamento_enviado", label: "Orcamento Enviado" },
  { key: "agendamento", label: "Agendamento" },
  { key: "compareceu", label: "Compareceu" },
  { key: "fechado", label: "Fechado" },
  { key: "perdido", label: "Perdido" },
];

function formatTime(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 86400000 && d.getDate() === now.getDate()) {
    return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

function formatMsgTime(iso: string) {
  return new Date(iso).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo"
  });
}

function TempBadge({ temp }: { temp: WhatsappConversation["temperature"] }) {
  if (temp === "hot") return <span title="Lead Quente" style={{ fontSize: 14 }}>🔴</span>;
  if (temp === "warm") return <span title="Lead Morno" style={{ fontSize: 14 }}>🟡</span>;
  return null;
}

function avatarUrl(phone: string) {
  const digits = phone.replace(/@.*$/, "").replace(/\D/g, "");
  return `/api/whatsapp/contacts/avatar?phone=${digits}`;
}

function ContactAvatar({
  name,
  phone,
  size = 38,
  fontSize = "0.85rem"
}: {
  name: string | null;
  phone: string;
  size?: number;
  fontSize?: string;
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const letters = name ? name.slice(0, 2).toUpperCase() : phone.slice(-2);

  return (
    <div
      className="inbox-conv-item__avatar"
      style={{ width: size, height: size, fontSize, position: "relative", overflow: "hidden", flexShrink: 0 }}
    >
      <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {letters}
      </span>
      {!imgFailed && (
        <img
          src={avatarUrl(phone)}
          alt=""
          onError={() => setImgFailed(true)}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            borderRadius: "inherit"
          }}
        />
      )}
    </div>
  );
}

export function InboxClient({ isAgencyAdmin }: Props) {
  const [conversations, setConversations] = useState<WhatsappConversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<WhatsappMessage[]>([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [sendText, setSendText] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const msgsEndRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Quick replies
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>([]);
  const [showQuickReplies, setShowQuickReplies] = useState(false);

  // Hot lead modal
  const [showHotModal, setShowHotModal] = useState(false);
  const [hotReason, setHotReason] = useState("");
  const [updatingTemp, setUpdatingTemp] = useState(false);

  // Stage update
  const [updatingStage, setUpdatingStage] = useState(false);

  const selectedConv = conversations.find((c) => c.id === selectedId) ?? null;

  const loadConversations = useCallback(async () => {
    try {
      const res = await fetch("/api/whatsapp/inbox/conversations");
      const data = (await res.json()) as { conversations?: WhatsappConversation[] };
      if (data.conversations) setConversations(data.conversations);
    } catch {}
  }, []);

  const loadMessages = useCallback(async (id: string) => {
    setLoadingMsgs(true);
    try {
      const res = await fetch(`/api/whatsapp/inbox/conversations/${id}/messages`);
      const data = (await res.json()) as { messages?: WhatsappMessage[] };
      if (data.messages) setMessages(data.messages);
    } catch {}
    setLoadingMsgs(false);
  }, []);

  useEffect(() => {
    loadConversations();
    pollingRef.current = setInterval(loadConversations, 5000);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [loadConversations]);

  useEffect(() => {
    if (!selectedId) return;
    loadMessages(selectedId);
    const t = setInterval(() => loadMessages(selectedId), 5000);
    return () => clearInterval(t);
  }, [selectedId, loadMessages]);

  useEffect(() => {
    msgsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load quick replies once
  useEffect(() => {
    fetch("/api/whatsapp/quick-replies")
      .then((r) => r.json())
      .then((d: { replies?: QuickReply[] }) => setQuickReplies(d.replies ?? []))
      .catch(() => {});
  }, []);

  async function handleSend() {
    if (!selectedId || !sendText.trim()) return;
    setSending(true);
    setSendError("");
    setShowQuickReplies(false);
    try {
      const res = await fetch(`/api/whatsapp/inbox/conversations/${selectedId}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: sendText.trim() })
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (data.error) { setSendError(data.error); }
      else {
        setSendText("");
        await loadMessages(selectedId);
      }
    } catch {
      setSendError("Erro ao enviar.");
    }
    setSending(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  async function handleMarkHot() {
    if (!selectedConv) return;
    setUpdatingTemp(true);
    try {
      await fetch(`/api/pipeline/conversations/${selectedConv.id}/temperature`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ temperature: "hot", reason: hotReason.trim() || null })
      });
      setConversations((prev) =>
        prev.map((c) =>
          c.id === selectedConv.id
            ? { ...c, temperature: "hot", hot_reason: hotReason.trim() || null }
            : c
        )
      );
      setShowHotModal(false);
      setHotReason("");
    } catch {}
    setUpdatingTemp(false);
  }

  async function handleUnmarkHot() {
    if (!selectedConv) return;
    setUpdatingTemp(true);
    try {
      await fetch(`/api/pipeline/conversations/${selectedConv.id}/temperature`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ temperature: "cold" })
      });
      setConversations((prev) =>
        prev.map((c) =>
          c.id === selectedConv.id ? { ...c, temperature: "cold", hot_reason: null } : c
        )
      );
    } catch {}
    setUpdatingTemp(false);
  }

  async function handleStageChange(stage: string) {
    if (!selectedConv) return;
    setUpdatingStage(true);
    try {
      await fetch(`/api/pipeline/conversations/${selectedConv.id}/stage`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage })
      });
      setConversations((prev) =>
        prev.map((c) => (c.id === selectedConv.id ? { ...c, pipeline_stage: stage } : c))
      );
    } catch {}
    setUpdatingStage(false);
  }

  const qrCategories = [...new Set(quickReplies.map((r) => r.category))].sort();

  return (
    <div className="inbox-layout">
      {/* ── Painel esquerdo — lista de conversas ── */}
      <div className="inbox-panel-left">
        <div className="inbox-panel-left__header">
          <span>Conversas</span>
          <span className="inbox-panel-left__count">{conversations.length}</span>
        </div>

        <div className="inbox-convs">
          {conversations.length === 0 && (
            <p className="inbox-convs__empty">Nenhuma conversa ainda.</p>
          )}
          {conversations.map((conv) => {
            const name = conv.contact_name ?? conv.contact_phone;
            const active = conv.id === selectedId;
            return (
              <button
                key={conv.id}
                className={`inbox-conv-item${active ? " inbox-conv-item--active" : ""}`}
                onClick={() => setSelectedId(conv.id)}
              >
                <ContactAvatar name={conv.contact_name} phone={conv.contact_phone} />
                <div className="inbox-conv-item__info">
                  <div className="inbox-conv-item__top">
                    <span className="inbox-conv-item__name">
                      {conv.temperature === "hot" && <span style={{ fontSize: 11 }}>🔴 </span>}
                      {name}
                    </span>
                    <span className="inbox-conv-item__time">
                      {formatTime(conv.last_message_at)}
                    </span>
                  </div>
                  <div className="inbox-conv-item__preview">
                    {conv.last_message_text ?? ""}
                  </div>
                  {conv.connection_name && (
                    <span className="inbox-conv-item__tag">{conv.connection_name}</span>
                  )}
                </div>
                {conv.unread_count > 0 && (
                  <span className="inbox-unread">{conv.unread_count}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Painel direito — chat ── */}
      <div className="inbox-panel-right">
        {!selectedConv ? (
          <div className="inbox-panel-right__empty">
            <div>
              <div style={{ fontSize: 36, marginBottom: 8 }}>💬</div>
              <p style={{ fontSize: "0.88rem" }}>Selecione uma conversa</p>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="inbox-msgs-header">
              <ContactAvatar
                name={selectedConv.contact_name}
                phone={selectedConv.contact_phone}
                size={34}
                fontSize="0.75rem"
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--dark)", display: "flex", alignItems: "center", gap: 6 }}>
                  <TempBadge temp={selectedConv.temperature} />
                  {selectedConv.contact_name ?? selectedConv.contact_phone}
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>
                  {selectedConv.contact_phone}
                  {selectedConv.connection_name && ` · ${selectedConv.connection_name}`}
                </div>
                {/* Pipeline stage */}
                <div style={{ marginTop: 4, display: "flex", alignItems: "center", gap: 6 }}>
                  <select
                    value={selectedConv.pipeline_stage ?? "novo_lead"}
                    disabled={updatingStage}
                    onChange={(e) => handleStageChange(e.target.value)}
                    style={{
                      fontSize: "0.7rem",
                      border: "1px solid var(--border)",
                      borderRadius: 5,
                      padding: "1px 4px",
                      background: "transparent",
                      cursor: "pointer",
                      color: "var(--muted)",
                    }}
                  >
                    {STAGES.map((s) => (
                      <option key={s.key} value={s.key}>{s.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Hot lead toggle */}
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                {selectedConv.temperature === "hot" ? (
                  <button
                    className="dashboard-button dashboard-button--ghost"
                    style={{ fontSize: "0.72rem", height: 30, padding: "0 10px", color: "#c53030" }}
                    onClick={handleUnmarkHot}
                    disabled={updatingTemp}
                  >
                    🔴 Lead Quente
                  </button>
                ) : (
                  <button
                    className="dashboard-button dashboard-button--ghost"
                    style={{ fontSize: "0.72rem", height: 30, padding: "0 10px" }}
                    onClick={() => setShowHotModal(true)}
                    disabled={updatingTemp}
                  >
                    Marcar Quente
                  </button>
                )}

                <a
                  href={`https://wa.me/55${selectedConv.contact_phone.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="dashboard-button dashboard-button--ghost"
                  style={{ textDecoration: "none", fontSize: "0.78rem", height: 32, display: "inline-flex", alignItems: "center", gap: 6 }}
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 14, height: 14 }}>
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  Abrir no WhatsApp
                </a>
              </div>
            </div>

            {/* Hot lead modal */}
            {showHotModal && (
              <div
                style={{
                  position: "absolute",
                  top: 0, left: 0, right: 0, bottom: 0,
                  background: "rgba(0,0,0,0.35)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 100,
                }}
                onClick={(e) => { if (e.target === e.currentTarget) setShowHotModal(false); }}
              >
                <div
                  style={{
                    background: "#fff",
                    borderRadius: 12,
                    padding: "1.5rem",
                    width: 340,
                    maxWidth: "90vw",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
                  }}
                >
                  <h3 style={{ fontWeight: 700, fontSize: "1rem", marginBottom: 12 }}>
                    🔴 Marcar como Lead Quente
                  </h3>
                  <p style={{ fontSize: "0.82rem", color: "var(--muted)", marginBottom: 12 }}>
                    Informe o motivo (opcional):
                  </p>
                  <textarea
                    rows={3}
                    value={hotReason}
                    onChange={(e) => setHotReason(e.target.value)}
                    placeholder="Ex: Muito interessado, pediu orcamento..."
                    style={{
                      width: "100%",
                      border: "1px solid var(--border)",
                      borderRadius: 6,
                      padding: "8px 10px",
                      fontSize: "0.85rem",
                      resize: "vertical",
                      boxSizing: "border-box",
                    }}
                  />
                  <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                    <button
                      className="dashboard-button"
                      onClick={handleMarkHot}
                      disabled={updatingTemp}
                    >
                      {updatingTemp ? "Salvando..." : "Confirmar"}
                    </button>
                    <button
                      className="dashboard-button dashboard-button--ghost"
                      onClick={() => { setShowHotModal(false); setHotReason(""); }}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Mensagens */}
            <div className="inbox-msgs">
              {loadingMsgs && messages.length === 0 ? (
                <p className="inbox-msgs__loading">Carregando...</p>
              ) : messages.length === 0 ? (
                <p className="inbox-msgs__loading">Nenhuma mensagem.</p>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`inbox-msg ${msg.direction === "inbound" ? "inbox-msg--in" : "inbox-msg--out"}`}
                  >
                    {msg.message_type === "audioMessage" && !msg.text ? (
                      <div className="inbox-msg__bubble" style={{ padding: "6px 8px", minWidth: 220 }}>
                        <audio
                          controls
                          src={`/api/whatsapp/inbox/conversations/${selectedId}/messages/${msg.id}/media`}
                          style={{ width: "100%", height: 36, display: "block" }}
                          preload="metadata"
                        />
                      </div>
                    ) : (msg.message_type === "imageMessage" || msg.message_type === "stickerMessage") && !msg.text ? (
                      <div className="inbox-msg__bubble" style={{ padding: 4 }}>
                        <img
                          src={`/api/whatsapp/inbox/conversations/${selectedId}/messages/${msg.id}/media`}
                          alt="imagem"
                          style={{ maxWidth: 260, maxHeight: 300, borderRadius: 8, display: "block", cursor: "pointer" }}
                          onClick={(e) => window.open((e.target as HTMLImageElement).src, "_blank")}
                        />
                      </div>
                    ) : msg.message_type === "videoMessage" && !msg.text ? (
                      <div className="inbox-msg__bubble" style={{ padding: 4 }}>
                        <video
                          controls
                          src={`/api/whatsapp/inbox/conversations/${selectedId}/messages/${msg.id}/media`}
                          style={{ maxWidth: 260, maxHeight: 300, borderRadius: 8, display: "block" }}
                        />
                      </div>
                    ) : msg.message_type === "documentMessage" && !msg.text ? (
                      <div className="inbox-msg__bubble" style={{ padding: "8px 12px" }}>
                        <a
                          href={`/api/whatsapp/inbox/conversations/${selectedId}/messages/${msg.id}/media`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: "var(--brand-dark)", textDecoration: "underline", fontSize: "0.85rem" }}
                        >
                          Baixar documento
                        </a>
                      </div>
                    ) : (
                      <div
                        className={`inbox-msg__bubble${
                          msg.message_type !== "text" && !msg.text ? " inbox-msg__bubble--media" : ""
                        }`}
                      >
                        {msg.text ?? `(${msg.message_type})`}
                      </div>
                    )}
                    <span className="inbox-msg__time">{formatMsgTime(msg.created_at)}</span>
                  </div>
                ))
              )}
              <div ref={msgsEndRef} />
            </div>

            {/* Quick Replies Panel */}
            {showQuickReplies && quickReplies.length > 0 && (
              <div
                style={{
                  borderTop: "1px solid var(--border)",
                  maxHeight: 220,
                  overflowY: "auto",
                  background: "var(--surface, #f8fafc)",
                  padding: "8px 10px",
                }}
              >
                <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  Respostas Rapidas
                </div>
                {qrCategories.map((cat) => (
                  <div key={cat} style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: "0.68rem", color: "var(--muted)", marginBottom: 4, opacity: 0.7 }}>{cat}</div>
                    {quickReplies.filter((r) => r.category === cat).map((r) => (
                      <button
                        key={r.id}
                        onClick={() => { setSendText(r.message); setShowQuickReplies(false); }}
                        style={{
                          display: "block",
                          width: "100%",
                          textAlign: "left",
                          background: "none",
                          border: "1px solid var(--border)",
                          borderRadius: 6,
                          padding: "5px 9px",
                          marginBottom: 4,
                          cursor: "pointer",
                          fontSize: "0.78rem",
                        }}
                      >
                        <strong style={{ fontSize: "0.75rem" }}>{r.title}</strong>
                        <div style={{ color: "var(--muted)", marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {r.message}
                        </div>
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            )}

            {/* Input — enviar mensagem */}
            <div className="inbox-input">
              {sendError && (
                <p style={{ color: "var(--error, #ef4444)", fontSize: "0.75rem", marginBottom: 6 }}>
                  {sendError}
                </p>
              )}
              <div className="inbox-input__row">
                {quickReplies.length > 0 && (
                  <button
                    className="dashboard-button dashboard-button--ghost"
                    style={{ fontSize: "0.75rem", height: 36, padding: "0 10px", flexShrink: 0 }}
                    onClick={() => setShowQuickReplies((v) => !v)}
                    title="Respostas rapidas"
                  >
                    ⚡
                  </button>
                )}
                <input
                  className="inbox-input__text"
                  placeholder="Digite uma mensagem..."
                  value={sendText}
                  onChange={(e) => setSendText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={sending}
                />
                <button
                  className="dashboard-button inbox-input__send"
                  onClick={handleSend}
                  disabled={sending || !sendText.trim()}
                >
                  {sending ? "..." : "Enviar"}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
