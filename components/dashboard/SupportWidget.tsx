"use client";

import { useRef, useState } from "react";
import type { AppSession } from "@/lib/dashboard-auth";

type Props = { user?: AppSession | null };

const TIPOS = [
  { value: "duvida", label: "Duvida" },
  { value: "problema", label: "Problema tecnico" },
  { value: "sugestao", label: "Sugestao" },
  { value: "financeiro", label: "Financeiro" }
];

export function SupportWidget({ user }: Props) {
  const [open, setOpen] = useState(false);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleClose() {
    setOpen(false);
    setSuccess(false);
    setFileName(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = e.currentTarget;
    const fd = new FormData(form);
    try {
      await fetch("/api/support", { method: "POST", body: fd });
      setSuccess(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        className="support-fab"
        onClick={() => { setOpen(true); setSuccess(false); }}
        aria-label="Abrir suporte"
      >
        <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
        </svg>
        Suporte
      </button>

      {open && (
        <>
          <div className="support-backdrop" onClick={handleClose} />
          <div className="support-modal" role="dialog" aria-modal="true" aria-labelledby="support-modal-title">
            {success ? (
              <div className="support-modal__success">
                <div className="support-modal__success-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </div>
                <h3>Solicitacao enviada!</h3>
                <p>Recebemos sua solicitacao! Vamos te responder em breve.</p>
                <button className="dashboard-button dashboard-button--brand" onClick={handleClose} style={{ marginTop: 8 }}>
                  Fechar
                </button>
              </div>
            ) : (
              <>
                <div className="support-modal__header">
                  <h2 id="support-modal-title">Fale com o suporte</h2>
                  <button className="support-modal__close" onClick={handleClose} aria-label="Fechar">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                      <path strokeLinecap="round" d="M1 1l12 12M13 1L1 13" />
                    </svg>
                  </button>
                </div>

                <form className="support-modal__body" onSubmit={handleSubmit}>
                  <p className="support-modal__subtitle">
                    Descreva sua duvida ou problema. Responderemos pelo email cadastrado.
                  </p>

                  {user?.email && (
                    <input type="hidden" name="userEmail" value={user.email} />
                  )}

                  <label className="dashboard-field">
                    <span>Tipo de solicitacao</span>
                    <select name="type" required defaultValue="">
                      <option value="" disabled>Selecione...</option>
                      {TIPOS.map(t => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </label>

                  <label className="dashboard-field">
                    <span>Mensagem</span>
                    <textarea
                      name="message"
                      required
                      placeholder="Descreva o problema ou duvida com detalhes"
                      style={{ minHeight: 120 }}
                    />
                  </label>

                  <div>
                    <p className="dashboard-field__help" style={{ marginBottom: 6 }}>Anexo (print, opcional)</p>
                    <label className="support-file-label">
                      <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                      {fileName ? (
                        <span className="support-file-name">{fileName}</span>
                      ) : (
                        <span>Anexar imagem (PNG, JPG)</span>
                      )}
                      <input
                        ref={fileRef}
                        type="file"
                        name="attachment"
                        accept="image/*"
                        onChange={e => setFileName(e.target.files?.[0]?.name ?? null)}
                      />
                    </label>
                  </div>

                  <button
                    type="submit"
                    className="dashboard-button dashboard-button--brand"
                    disabled={loading}
                    style={{ marginTop: 4, height: 42 }}
                  >
                    {loading ? "Enviando..." : "Enviar solicitacao"}
                  </button>
                </form>
              </>
            )}
          </div>
        </>
      )}
    </>
  );
}
