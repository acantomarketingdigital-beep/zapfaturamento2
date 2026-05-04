"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { WhatsappConversation, WhatsappMessage } from "@/lib/whatsapp-connections";

type Props = {
  initialConversations: WhatsappConversation[];
  connections: { id: string; connection_name: string; status: string }[];
  canReply: boolean;
};

function formatTime(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const sameDay =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();

  if (sameDay) {
    return new Intl.DateTimeFormat("pt-BR", {
      timeStyle: "short",
      timeZone: "America/Sao_Paulo"
    }).format(d);
  }
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeZone: "America/Sao_Paulo"
  }).format(d);
}

function formatFullTime(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo"
  }).format(new Date(iso));
}

function initials(name: string | null, phone: string) {
  if (name) {
    const parts = name.trim().split(" ");
    return parts.length > 1
      ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
      : parts[0].slice(0, 2).toUpperCase();
  }
  return phone.slice(-2);
}

export function InboxView({ initialConversations, connections, canReply }: Props) {
  const [conversations, setConversations] = useState<WhatsappConversation[]>(initialConversations);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<WhatsappMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [filterConnectionId, setFilterConnectionId] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const selectedConv = conversations.find((c) => c.id === selectedId) ?? null;

  const fetchConversations = useCallback(async () => {
    try {
      const url = filterConnectionId
        ? `/api/whatsapp/inbox/conversations?connection_id=${encodeURIComponent(filterConnectionId)}`
        : "/api/whatsapp/inbox/conversations";
      const res = await fetch(url);
      const data = (await res.json()) as { conversations?: WhatsappConversation[] };
      if (data.conversations) setConversations(data.conversations);
    } catch {
      // ignore polling errors
    }
  }, [filterConnectionId]);

  const fetchMessages = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/whatsapp/inbox/conversations/${id}/messages`);
      const data = (await res.json()) as { messages?: WhatsappMessage[] };
      if (data.messages) {
        setMessages(data.messages);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
      }
    } catch {
      // ignore
    }
  }, []);

  // Poll conversations every 5s
  useEffect(() => {
    const interval = setInterval(fetchConversations, 5000);
    return () => clearInterval(interval);
  }, [fetchConversations]);

  // Poll messages for selected conversation every 3s
  useEffect(() => {
    if (!selectedId) return;
    const interval = setInterval(() => fetchMessages(selectedId), 3000);
    return () => clearInterval(interval);
  }, [selectedId, fetchMessages]);

  const handleSelectConversation = async (id: string) => {
    setSelectedId(id);
    setMessages([]);
    setLoadingMessages(true);
    await fetchMessages(id);
    setLoadingMessages(false);
    // Mark as read in local state
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, unread_count: 0 } : c))
    );
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId || !newMessage.trim()) return;
    setSending(true);
    setSendError("");
    try {
      const res = await fetch(`/api/whatsapp/inbox/conversations/${selectedId}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: newMessage.trim() })
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setSendError(data.error ?? "Erro ao enviar mensagem.");
      } else {
        setNewMessage("");
        await fetchMessages(selectedId);
      }
    } catch {
      setSendError("Erro de rede.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="inbox-layout">
      {/* Left panel: conversations */}
      <div className="inbox-panel-left">
        <div className="inbox-panel-left__header">
          <strong>Conversas</strong>
          <span className="inbox-panel-left__count">{conversations.length}</span>
        </div>

        {connections.length > 1 && (
          <div style={{ padding: "8px 12px", borderBottom: "1px solid var(--border)" }}>
            <select
              value={filterConnectionId}
              onChange={(e) => {
                setFilterConnectionId(e.target.value);
              }}
              style={{ width: "100%", fontSize: "0.78rem", padding: "4px 6px" }}
            >
              <option value="">Todas as conexoes</option>
              {connections.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.connection_name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="inbox-convs">
          {conversations.length === 0 ? (
            <div className="inbox-convs__empty">Nenhuma conversa ainda.</div>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.id}
                className={`inbox-conv-item${selectedId === conv.id ? " inbox-conv-item--active" : ""}`}
                onClick={() => handleSelectConversation(conv.id)}
              >
                <div className="inbox-conv-item__avatar">
                  {initials(conv.contact_name, conv.contact_phone)}
                </div>
                <div className="inbox-conv-item__info">
                  <div className="inbox-conv-item__top">
                    <span className="inbox-conv-item__name">
                      {conv.contact_name ?? conv.contact_phone}
                    </span>
                    <span className="inbox-conv-item__time">
                      {formatTime(conv.last_message_at)}
                    </span>
                  </div>
                  <div className="inbox-conv-item__preview">
                    {conv.last_message_text ?? "Sem mensagens"}
                  </div>
                  {conv.connection_name && (
                    <div className="inbox-conv-item__tag">{conv.connection_name}</div>
                  )}
                </div>
                {conv.unread_count > 0 && (
                  <span className="inbox-unread">{conv.unread_count}</span>
                )}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Right panel: messages */}
      <div className="inbox-panel-right">
        {!selectedConv ? (
          <div className="inbox-panel-right__empty">
            <div>
              <div style={{ fontSize: 48, marginBottom: 12 }}>💬</div>
              <strong>Selecione uma conversa</strong>
              <p style={{ color: "var(--muted)", marginTop: 6, fontSize: "0.85rem" }}>
                As mensagens aparecao aqui.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Conversation header */}
            <div className="inbox-msgs-header">
              <div className="inbox-conv-item__avatar" style={{ width: 36, height: 36, fontSize: "0.85rem" }}>
                {initials(selectedConv.contact_name, selectedConv.contact_phone)}
              </div>
              <div>
                <strong>{selectedConv.contact_name ?? selectedConv.contact_phone}</strong>
                <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>
                  {selectedConv.contact_phone}
                  {selectedConv.connection_name && ` · ${selectedConv.connection_name}`}
                </div>
              </div>
              {selectedConv.utm_campaign && (
                <div style={{ marginLeft: "auto", fontSize: "0.72rem", color: "var(--muted)", textAlign: "right" }}>
                  <div>Campanha: {selectedConv.utm_campaign}</div>
                  {selectedConv.utm_content && <div>Criativo: {selectedConv.utm_content}</div>}
                  {selectedConv.utm_term && <div>Publico: {selectedConv.utm_term}</div>}
                </div>
              )}
            </div>

            {/* Messages list */}
            <div className="inbox-msgs">
              {loadingMessages ? (
                <div className="inbox-msgs__loading">Carregando mensagens...</div>
              ) : messages.length === 0 ? (
                <div className="inbox-msgs__loading">Nenhuma mensagem nesta conversa.</div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`inbox-msg ${
                      msg.direction === "outbound" ? "inbox-msg--out" : "inbox-msg--in"
                    }`}
                  >
                    {msg.text ? (
                      <div className="inbox-msg__bubble">{msg.text}</div>
                    ) : (
                      <div className="inbox-msg__bubble inbox-msg__bubble--media">
                        ({msg.message_type ?? "mídia"})
                      </div>
                    )}
                    <div className="inbox-msg__time">{formatFullTime(msg.created_at)}</div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input area */}
            {canReply && (
              <form className="inbox-input" onSubmit={handleSend}>
                {sendError && (
                  <div className="dashboard-alert dashboard-alert--error" style={{ margin: "0 12px 8px", fontSize: "0.78rem" }}>
                    {sendError}
                  </div>
                )}
                <div className="inbox-input__row">
                  <input
                    className="inbox-input__text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Digite uma mensagem..."
                    disabled={sending}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend(e);
                      }
                    }}
                  />
                  <button
                    type="submit"
                    className="dashboard-button inbox-input__send"
                    disabled={sending || !newMessage.trim()}
                  >
                    {sending ? "..." : "Enviar"}
                  </button>
                </div>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}
