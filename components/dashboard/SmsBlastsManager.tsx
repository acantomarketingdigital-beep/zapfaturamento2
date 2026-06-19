"use client";

import { useState } from "react";
import { CopyButton } from "@/components/dashboard/CopyButton";

type PromoAspect = "1:1" | "3:4" | "9:16";

type SmsBlast = {
  id: string;
  clientSlug: string;
  name: string;
  shortCode: string;
  promoImageUrl: string | null;
  promoImageAspect: PromoAspect;
  promoTitle: string | null;
  promoDescription: string | null;
  smsTemplate: string | null;
  ctaText: string;
  whatsappNumber: string;
  whatsappMessage: string;
  isActive: boolean;
  createdAt: string;
};

type ModalState = {
  mode: "create" | "edit";
  id?: string;
  name: string;
  promoImageAspect: PromoAspect;
  promoTitle: string;
  promoDescription: string;
  smsTemplate: string;
  ctaText: string;
  whatsappNumber: string;
  whatsappMessage: string;
};

type Props = {
  initialBlasts: SmsBlast[];
  clientSlug: string;
  baseUrl: string;
  defaultWhatsappNumber: string;
  canManage: boolean;
};

const ASPECT_OPTIONS: { value: PromoAspect; label: string; desc: string }[] = [
  { value: "1:1",  label: "Quadrado",  desc: "1:1 — Feed / Stories" },
  { value: "3:4",  label: "Retrato",   desc: "3:4 — Feed vertical" },
  { value: "9:16", label: "Stories",   desc: "9:16 — Tela cheia" },
];

function smsPreview(template: string, link: string): string {
  return template.replace(/\{link\}/g, link);
}

function pickImageFile(onPick: (file: File) => void) {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  input.onchange = () => {
    const f = input.files?.[0];
    if (f) onPick(f);
  };
  input.click();
}

export function SmsBlastsManager({
  initialBlasts,
  clientSlug,
  baseUrl,
  defaultWhatsappNumber,
  canManage,
}: Props) {
  const [blasts, setBlasts] = useState<SmsBlast[]>(initialBlasts);
  const [modal, setModal] = useState<ModalState | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  function promoUrl(shortCode: string) {
    return `${baseUrl}/p/${shortCode}`;
  }

  function openCreate() {
    setError("");
    setModal({
      mode: "create",
      name: "",
      promoImageAspect: "1:1",
      promoTitle: "",
      promoDescription: "",
      smsTemplate: "{nome} — {oferta}\n\n👉 Ver promoção: {link}",
      ctaText: "Quero aproveitar",
      whatsappNumber: defaultWhatsappNumber,
      whatsappMessage: "Vim da promoção",
    });
  }

  function openEdit(b: SmsBlast) {
    setError("");
    setModal({
      mode: "edit",
      id: b.id,
      name: b.name,
      promoImageAspect: b.promoImageAspect,
      promoTitle: b.promoTitle ?? "",
      promoDescription: b.promoDescription ?? "",
      smsTemplate: b.smsTemplate ?? "{nome} — {oferta}\n\n👉 Ver promoção: {link}",
      ctaText: b.ctaText,
      whatsappNumber: b.whatsappNumber,
      whatsappMessage: b.whatsappMessage,
    });
  }

  function closeModal() { setModal(null); setError(""); }

  async function handleSave() {
    if (!modal) return;
    setError(""); setSaving(true);
    try {
      const isCreate = modal.mode === "create";
      const res = await fetch(
        isCreate ? "/api/sms-blasts" : `/api/sms-blasts/${modal.id}`,
        {
          method: isCreate ? "POST" : "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clientSlug,
            name: modal.name,
            promoImageAspect: modal.promoImageAspect,
            promoTitle: modal.promoTitle || null,
            promoDescription: modal.promoDescription || null,
            smsTemplate: modal.smsTemplate || null,
            ctaText: modal.ctaText || "Saiba mais",
            whatsappNumber: modal.whatsappNumber,
            whatsappMessage: modal.whatsappMessage,
          }),
        }
      );
      const data = await res.json() as { blast?: SmsBlast; error?: string };
      if (!res.ok) { setError(data.error ?? "Erro ao salvar."); return; }
      if (isCreate) {
        setBlasts((prev) => [data.blast!, ...prev]);
      } else {
        setBlasts((prev) => prev.map((b) => b.id === modal.id ? data.blast! : b));
      }
      closeModal();
    } catch { setError("Erro de rede."); }
    finally { setSaving(false); }
  }

  async function handleToggle(b: SmsBlast) {
    const res = await fetch(`/api/sms-blasts/${b.id}/toggle`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientSlug, isActive: !b.isActive }),
    });
    const data = await res.json() as { blast?: SmsBlast };
    if (res.ok && data.blast) setBlasts((prev) => prev.map((x) => x.id === b.id ? data.blast! : x));
  }

  async function handleDelete(b: SmsBlast) {
    if (!window.confirm(`Remover "${b.name}"?`)) return;
    await fetch(`/api/sms-blasts/${b.id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientSlug }),
    });
    setBlasts((prev) => prev.filter((x) => x.id !== b.id));
  }

  async function handleImageUpload(blastId: string, file: File) {
    setUploadingId(blastId);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("clientSlug", clientSlug);
      const res = await fetch(`/api/sms-blasts/${blastId}/media`, { method: "POST", body: fd });
      const data = await res.json() as { url?: string; error?: string };
      if (!res.ok) { alert(data.error ?? "Erro ao fazer upload."); return; }
      setBlasts((prev) => prev.map((b) => b.id === blastId ? { ...b, promoImageUrl: data.url! } : b));
    } catch { alert("Erro de rede ao fazer upload."); }
    finally { setUploadingId(null); }
  }

  async function handleImageRemove(blastId: string) {
    setUploadingId(blastId);
    try {
      await fetch(`/api/sms-blasts/${blastId}/media`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientSlug }),
      });
      setBlasts((prev) => prev.map((b) => b.id === blastId ? { ...b, promoImageUrl: null } : b));
    } finally { setUploadingId(null); }
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <p className="dashboard-helper" style={{ margin: 0 }}>
          Crie promoções com imagem e link curto para disparar via SMS. Cada promo gera uma página dedicada que abre o WhatsApp.
        </p>
        {canManage && (
          <button type="button" className="dashboard-button" onClick={openCreate} style={{ flexShrink: 0, marginLeft: 16 }}>
            + Nova promoção
          </button>
        )}
      </div>

      {blasts.length === 0 ? (
        <div className="dashboard-empty">
          Nenhuma promoção criada. Clique em &ldquo;+ Nova promoção&rdquo; para começar.
        </div>
      ) : (
        <div style={{ display: "grid", gap: 16 }}>
          {blasts.map((b) => {
            const link = promoUrl(b.shortCode);
            const smsText = b.smsTemplate ? smsPreview(b.smsTemplate, link) : link;
            const isUploading = uploadingId === b.id;

            return (
              <div key={b.id} className="dashboard-card" style={{ padding: "16px 20px" }}>
                {/* Header */}
                <div className="dashboard-inline-actions" style={{ marginBottom: 12 }}>
                  <strong style={{ fontSize: "1rem" }}>{b.name}</strong>
                  <span className={`dashboard-pill ${b.isActive ? "dashboard-pill--success" : "dashboard-pill--error"}`}>
                    {b.isActive ? "Ativa" : "Inativa"}
                  </span>
                  <span className="dashboard-pill dashboard-pill--neutral">{b.promoImageAspect}</span>
                </div>

                {/* Content grid */}
                <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 16, marginBottom: 14 }}>
                  {/* Image */}
                  <div>
                    {b.promoImageUrl ? (
                      <div style={{ position: "relative", width: 120 }}>
                        <img
                          src={b.promoImageUrl}
                          alt="Promo"
                          style={{
                            width: 120,
                            aspectRatio: b.promoImageAspect.replace(":", " / "),
                            objectFit: "cover",
                            borderRadius: 8,
                            display: "block",
                          }}
                        />
                        {canManage && (
                          <button
                            type="button"
                            onClick={() => void handleImageRemove(b.id)}
                            disabled={isUploading}
                            style={{
                              position: "absolute", top: 4, right: 4,
                              background: "rgba(0,0,0,0.6)", color: "#fff",
                              border: "none", borderRadius: 4, padding: "2px 7px",
                              cursor: "pointer", fontSize: "0.72rem",
                            }}
                          >✕</button>
                        )}
                      </div>
                    ) : canManage ? (
                      <button
                        type="button"
                        onClick={() => pickImageFile((f) => void handleImageUpload(b.id, f))}
                        disabled={isUploading}
                        style={{
                          width: 120,
                          aspectRatio: b.promoImageAspect.replace(":", " / "),
                          border: "2px dashed var(--border, #e5e7eb)",
                          borderRadius: 8,
                          background: "none",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: isUploading ? "default" : "pointer",
                          color: "var(--text-muted, #9ca3af)",
                          fontSize: "0.75rem",
                          gap: 4,
                        }}
                      >
                        <span style={{ fontSize: "1.4rem" }}>🖼</span>
                        <span>{isUploading ? "Enviando..." : "Adicionar imagem"}</span>
                      </button>
                    ) : (
                      <div style={{
                        width: 120, aspectRatio: b.promoImageAspect.replace(":", " / "),
                        border: "2px dashed var(--border, #e5e7eb)", borderRadius: 8,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: "var(--text-muted, #9ca3af)", fontSize: "0.75rem",
                      }}>Sem imagem</div>
                    )}
                  </div>

                  {/* Info */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {b.promoTitle && (
                      <p style={{ margin: 0, fontWeight: 700, color: "var(--text)", fontSize: "0.95rem" }}>{b.promoTitle}</p>
                    )}
                    {b.promoDescription && (
                      <p className="dashboard-helper" style={{ margin: 0, whiteSpace: "pre-wrap" }}>
                        {b.promoDescription.length > 120 ? b.promoDescription.slice(0, 120) + "…" : b.promoDescription}
                      </p>
                    )}
                    <p className="dashboard-helper" style={{ margin: 0 }}>
                      Botão: <strong>{b.ctaText}</strong> → WhatsApp com <em>&ldquo;{b.whatsappMessage}&rdquo;</em>
                    </p>
                  </div>
                </div>

                {/* Link */}
                <div style={{ marginBottom: 10 }}>
                  <span className="dashboard-table__sub">Link da promoção</span>
                  <code className="dashboard-code-block" style={{ display: "block", marginTop: 4 }}>{link}</code>
                  <div style={{ marginTop: 4 }}>
                    <CopyButton value={link} label="Copiar link" />
                  </div>
                </div>

                {/* SMS preview */}
                <div style={{ marginBottom: 12 }}>
                  <span className="dashboard-table__sub">Preview do SMS</span>
                  <pre style={{
                    margin: "4px 0 0",
                    padding: "10px 12px",
                    background: "rgba(0,0,0,0.03)",
                    border: "1px solid var(--border, #e5e7eb)",
                    borderRadius: 8,
                    fontSize: "0.82rem",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    color: "var(--text)",
                    fontFamily: "inherit",
                  }}>
                    {smsText}
                  </pre>
                  <div style={{ marginTop: 4 }}>
                    <CopyButton value={smsText} label="Copiar texto do SMS" />
                  </div>
                </div>

                {canManage && (
                  <div className="dashboard-inline-actions">
                    <button type="button" className="dashboard-button dashboard-button--ghost" onClick={() => openEdit(b)}>Editar</button>
                    <button type="button" className="dashboard-button dashboard-button--ghost" onClick={() => void handleToggle(b)}>
                      {b.isActive ? "Desativar" : "Ativar"}
                    </button>
                    <button type="button" className="dashboard-button dashboard-button--ghost" onClick={() => void handleDelete(b)}>Remover</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="dashboard-modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
          <div className="dashboard-modal">
            <h3>{modal.mode === "create" ? "Nova promoção SMS" : "Editar promoção"}</h3>

            <div className="dashboard-form-stack">
              <div className="dashboard-field">
                <span>Nome interno</span>
                <input
                  type="text"
                  value={modal.name}
                  onChange={(e) => setModal({ ...modal, name: e.target.value })}
                  placeholder="Ex.: Black Friday Sofá, Promo Maio 2025"
                  autoFocus
                />
                <span className="dashboard-helper">Só você vê — não aparece para o lead.</span>
              </div>

              <div className="dashboard-field">
                <span>Formato da imagem</span>
                <div style={{ display: "flex", gap: 8 }}>
                  {ASPECT_OPTIONS.map((opt) => (
                    <label
                      key={opt.value}
                      style={{
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 6,
                        padding: "10px 8px",
                        borderRadius: 8,
                        border: `2px solid ${modal.promoImageAspect === opt.value ? "var(--brand, #2563eb)" : "var(--border, #e5e7eb)"}`,
                        background: modal.promoImageAspect === opt.value ? "rgba(37,99,235,0.07)" : "transparent",
                        cursor: "pointer",
                        textAlign: "center",
                      }}
                    >
                      <input
                        type="radio"
                        name="aspect"
                        value={opt.value}
                        checked={modal.promoImageAspect === opt.value}
                        onChange={() => setModal({ ...modal, promoImageAspect: opt.value })}
                        style={{ display: "none" }}
                      />
                      <div style={{
                        background: "var(--border, #e5e7eb)",
                        borderRadius: 4,
                        aspectRatio: opt.value.replace(":", " / "),
                        width: opt.value === "9:16" ? 20 : opt.value === "3:4" ? 24 : 32,
                      }} />
                      <span style={{ fontSize: "0.78rem", fontWeight: 700 }}>{opt.label}</span>
                      <span style={{ fontSize: "0.7rem", color: "var(--text-muted, #6b7280)", lineHeight: 1.3 }}>{opt.desc}</span>
                    </label>
                  ))}
                </div>
                <span className="dashboard-helper">A imagem pode ser adicionada após salvar.</span>
              </div>

              <div className="dashboard-field">
                <span>Título da promoção</span>
                <input
                  type="text"
                  value={modal.promoTitle}
                  onChange={(e) => setModal({ ...modal, promoTitle: e.target.value })}
                  placeholder="Ex.: Higienização de sofá com 30% OFF"
                />
              </div>

              <div className="dashboard-field">
                <span>Descrição</span>
                <textarea
                  rows={3}
                  value={modal.promoDescription}
                  onChange={(e) => setModal({ ...modal, promoDescription: e.target.value })}
                  placeholder="Ex.: Válido até domingo. Atendemos toda a região de Curitiba."
                />
              </div>

              <div className="dashboard-field">
                <span>Texto do botão CTA</span>
                <input
                  type="text"
                  value={modal.ctaText}
                  onChange={(e) => setModal({ ...modal, ctaText: e.target.value })}
                  placeholder="Ex.: Quero aproveitar, Saiba mais, Ver oferta"
                />
              </div>

              <div className="dashboard-field">
                <span>Número de WhatsApp</span>
                <input
                  type="text"
                  value={modal.whatsappNumber}
                  onChange={(e) => setModal({ ...modal, whatsappNumber: e.target.value })}
                  placeholder="5541999999999"
                />
              </div>

              <div className="dashboard-field">
                <span>Mensagem pré-preenchida no WhatsApp</span>
                <input
                  type="text"
                  value={modal.whatsappMessage}
                  onChange={(e) => setModal({ ...modal, whatsappMessage: e.target.value })}
                  placeholder="Vim da promoção de higienização de sofá"
                />
              </div>

              <div className="dashboard-field">
                <span>Template do SMS</span>
                <textarea
                  rows={4}
                  value={modal.smsTemplate}
                  onChange={(e) => setModal({ ...modal, smsTemplate: e.target.value })}
                  placeholder={"Studio Retrato\nSofá limpo com 30% OFF! 🛋️\n\n👉 {link}"}
                />
                <span className="dashboard-helper">
                  Use <code>{"{link}"}</code> onde o link deve aparecer. O envio SMS fica por conta da Zenvia ou outro provedor.
                </span>
              </div>

              {error && <div className="dashboard-alert dashboard-alert--error">{error}</div>}

              <div className="dashboard-inline-actions">
                <button type="button" className="dashboard-button" onClick={handleSave} disabled={saving}>
                  {saving ? "Salvando..." : "Salvar promoção"}
                </button>
                <button type="button" className="dashboard-button dashboard-button--ghost" onClick={closeModal} disabled={saving}>
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
