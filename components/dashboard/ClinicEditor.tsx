"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CustomerLogo } from "@/components/CustomerLogo";
import { slugifyClinicName } from "@/lib/clinic-shared";
import type { ManagedClinicFormValues } from "@/lib/clinics";

type ClinicEditorProps = {
  mode: "create" | "edit";
  values: ManagedClinicFormValues;
  cancelHref: string;
  redirectTo: string;
  existingSlugs: string[];
  databaseReady: boolean;
};

export function ClinicEditor({
  mode,
  values,
  cancelHref,
  redirectTo,
  existingSlugs,
  databaseReady
}: ClinicEditorProps) {
  const [clientName, setClientName] = useState(values.clientName);
  const [clientSlug, setClientSlug] = useState(values.clientSlug);
  const [slugTouched, setSlugTouched] = useState(Boolean(values.clientSlug));
  const [logoUrl, setLogoUrl] = useState(values.logoUrl || "");
  const [logoStatus, setLogoStatus] = useState<"loaded" | "error" | "empty">(
    values.logoUrl ? "loaded" : "empty"
  );
  const [whatsappNumber, setWhatsappNumber] = useState(values.whatsappNumber);
  const [isActive, setIsActive] = useState(values.isActive);

  useEffect(() => {
    if (!slugTouched) {
      setClientSlug(slugifyClinicName(clientName));
    }
  }, [clientName, slugTouched]);

  const normalizedExistingSlugs = useMemo(
    () => new Set(existingSlugs.filter(Boolean)),
    [existingSlugs]
  );
  const normalizedCurrentSlug = slugifyClinicName(clientSlug);
  const slugExists =
    Boolean(normalizedCurrentSlug) &&
    normalizedCurrentSlug !== (values.existingSlug || "") &&
    normalizedExistingSlugs.has(normalizedCurrentSlug);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const effectivePreviewUrl = localPreviewUrl ?? logoUrl;

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    const objectUrl = URL.createObjectURL(file);
    setLocalPreviewUrl(objectUrl);
    setUploadError(null);
    setIsUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/upload/logo", { method: "POST", body });
      const data = await res.json() as { url?: string; error?: string };
      if (!res.ok) throw new Error(data.error || "Erro ao fazer upload.");
      setLogoUrl(data.url || "");
      setLocalPreviewUrl(null);
      URL.revokeObjectURL(objectUrl);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Erro ao fazer upload.");
      setLocalPreviewUrl(null);
      URL.revokeObjectURL(objectUrl);
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="dashboard-editor-grid">
      <article className="dashboard-card">
        <div className="dashboard-card__header">
          <div>
            <span className="dashboard-eyebrow">
              {mode === "create" ? "Novo Cliente" : "Editar Cliente"}
            </span>
            <h2>
              {mode === "create"
                ? "Cadastro de cliente"
                : `Editar ${values.clientName || "cliente"}`}
            </h2>
            <p className="dashboard-helper">
              Preencha os campos abaixo para configurar o cliente.
            </p>
          </div>
        </div>

        {slugExists ? (
          <div className="dashboard-alert dashboard-alert--error">
            Ja existe um cliente usando esse slug. Escolha outro antes de salvar.
          </div>
        ) : null}

        {!databaseReady ? (
          <div className="dashboard-alert dashboard-alert--warning">
            Configure <code>DATABASE_URL</code> e rode as migrations para
            habilitar o salvamento dos clientes.
          </div>
        ) : null}

        <form
          action="/dashboard/clinicas/save"
          method="post"
          className="dashboard-form-stack"
        >
          <input type="hidden" name="existingSlug" value={values.existingSlug || ""} />
          <input type="hidden" name="redirectTo" value={redirectTo} />
          <input
            type="hidden"
            name="preserveMetaCapiAccessToken"
            value={values.metaCapiAccessTokenConfigured ? "true" : "false"}
          />
          {/* Preserve existing whatsapp message as fallback for old campaigns */}
          <input type="hidden" name="whatsappMessage" value={values.whatsappMessage || ""} />
          {/* Logo URL set by the upload handler */}
          <input type="hidden" name="logoUrl" value={logoUrl} />

          {/* ── 1. Identidade ───────────────────────────── */}
          <section className="dashboard-section">
            <div className="dashboard-section__header">
              <h3>1. Identidade</h3>
              <p>Defina nome, slug, logo e status do cliente.</p>
            </div>

            <div className="dashboard-form-grid">
              <label className="dashboard-field">
                <span>Nome do cliente</span>
                <input
                  type="text"
                  name="clientName"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Ex: Clinica Saude Total"
                  autoComplete="off"
                  required
                />
              </label>

              <label className="dashboard-field">
                <span>Slug da URL</span>
                <input
                  type="text"
                  name="clientSlug"
                  value={clientSlug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    setClientSlug(slugifyClinicName(e.target.value));
                  }}
                  placeholder="ex: clinica-saude-total"
                  autoComplete="off"
                  required
                />
                <small className="dashboard-field__help">
                  Gerado automaticamente pelo nome, mas pode ser ajustado.
                </small>
              </label>

              {/* Upload de logo */}
              <div className="dashboard-field dashboard-field--full">
                <span>Logo do cliente</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                  onChange={handleFileSelect}
                  style={{ display: "none" }}
                  aria-hidden="true"
                />
                <div className="dashboard-upload-zone">
                  {isUploading ? (
                    <span className="dashboard-upload-status">Enviando imagem...</span>
                  ) : effectivePreviewUrl ? (
                    <div className="dashboard-upload-actions">
                      <button
                        type="button"
                        className="dashboard-button dashboard-button--ghost"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        Trocar logo
                      </button>
                      <button
                        type="button"
                        className="dashboard-button dashboard-button--ghost"
                        onClick={() => { setLogoUrl(""); setUploadError(null); }}
                      >
                        Remover logo
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="dashboard-button dashboard-button--ghost"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Selecionar imagem
                    </button>
                  )}
                  {uploadError ? (
                    <p className="dashboard-upload-error">{uploadError}</p>
                  ) : null}
                </div>
                <small className="dashboard-field__help">
                  Recomendado: imagem quadrada (PNG ou WEBP) ate 2MB.
                </small>
              </div>

              <div className="dashboard-logo-preview dashboard-field--full">
                <CustomerLogo
                  logoUrl={effectivePreviewUrl}
                  clientName={clientName || "Cliente Exemplo"}
                  imageClassName="clinic-preview__logo"
                  placeholderClassName="clinic-preview__logo clinic-preview__logo--placeholder"
                  onStatusChange={setLogoStatus}
                />
                <div className="dashboard-logo-preview__text">
                  <strong>Previa da logo</strong>
                  <span>
                    {effectivePreviewUrl
                      ? "A logo sera exibida nas paginas do cliente."
                      : "Se nao houver logo, o sistema mostra as iniciais do cliente."}
                  </span>
                </div>
              </div>

              {effectivePreviewUrl && logoStatus === "error" ? (
                <div className="dashboard-alert dashboard-alert--warning dashboard-field--full">
                  Esse link nao parece ser uma imagem valida.
                </div>
              ) : null}

              <label className="dashboard-toggle">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                />
                <span>Cliente ativo para receber redirecionamentos</span>
              </label>
            </div>
          </section>

          {/* ── 2. WhatsApp ─────────────────────────────── */}
          <section className="dashboard-section">
            <div className="dashboard-section__header">
              <h3>2. WhatsApp</h3>
              <p>Numero de destino e delay antes do redirect.</p>
            </div>

            <div className="dashboard-form-grid">
              <label className="dashboard-field">
                <span>Numero do WhatsApp</span>
                <input
                  type="text"
                  name="whatsappNumber"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  placeholder="5511999999999"
                  required
                />
                <small className="dashboard-field__help">
                  Informe com DDI e DDD. Ex: 5511999999999
                </small>
              </label>

            </div>
          </section>

          {/* ── 3. Meta Ads / CAPI ──────────────────────── */}
          <section className="dashboard-section">
            <div className="dashboard-section__header">
              <h3>3. Meta Ads — Pixel + API de Conversoes</h3>
              <p>
                Configure browser Pixel e a API de Conversoes server-side para
                deduplicacao e melhor atribuicao.
              </p>
            </div>

            <div className="dashboard-form-grid">
              <label className="dashboard-field">
                <span>Meta Pixel ID</span>
                <input type="text" name="metaPixelId" defaultValue={values.metaPixelId} />
              </label>

              <label className="dashboard-field dashboard-field--full">
                <span>Meta Access Token da CAPI</span>
                <input
                  type="password"
                  name="metaCapiAccessToken"
                  defaultValue=""
                  placeholder={
                    values.metaCapiAccessTokenConfigured
                      ? "•••••••• token salvo - preencha apenas para substituir"
                      : "Cole o access token da API de Conversoes"
                  }
                  autoComplete="new-password"
                />
                <small className="dashboard-field__help">
                  O token nunca aparece novamente depois de salvo. Se deixar em
                  branco na edicao, o token atual e preservado.
                </small>
              </label>
            </div>

            <div className="dashboard-inline-actions">
              <span className="dashboard-pill dashboard-pill--meta">
                {values.metaCapiConfigured ? "CAPI ativa" : "CAPI nao configurada"}
              </span>
            </div>
          </section>

          {/* ── 4. Tracking adicional ───────────────────── */}
          <section className="dashboard-section">
            <div className="dashboard-section__header">
              <h3>4. Tracking adicional</h3>
              <p>IDs opcionais para GTM, GA4 e Google Ads.</p>
            </div>

            <div className="dashboard-form-grid">
              <label className="dashboard-field">
                <span>GTM ID</span>
                <input type="text" name="gtmId" defaultValue={values.gtmId} />
              </label>

              <label className="dashboard-field">
                <span>GA4 ID</span>
                <input type="text" name="ga4Id" defaultValue={values.ga4Id} />
              </label>

              <label className="dashboard-field">
                <span>ID de Conversão</span>
                <input type="text" name="googleAdsId" defaultValue={values.googleAdsId} />
              </label>

              <label className="dashboard-field dashboard-field--full">
                <span>Rótulo de Conversão</span>
                <input
                  type="text"
                  name="googleAdsConversionLabel"
                  defaultValue={values.googleAdsConversionLabel}
                />
              </label>
            </div>
          </section>

          <div className="dashboard-actions">
            <button
              type="submit"
              name="intent"
              value="save"
              className="dashboard-button"
              disabled={slugExists || !databaseReady}
            >
              Salvar cliente
            </button>
              <a href={cancelHref} className="dashboard-button dashboard-button--ghost">
              Cancelar
            </a>
          </div>
        </form>
      </article>

      <aside className="dashboard-editor-side">
        <article className="dashboard-card">
          <div className="dashboard-card__header">
            <div>
              <h3>Previa da pagina de redirect</h3>
              <p className="dashboard-helper">
                Visual aproximado da experiencia que o lead vera antes de ir
                para o WhatsApp.
              </p>
            </div>
          </div>

          <div className="clinic-preview">
            <CustomerLogo
              logoUrl={effectivePreviewUrl}
              clientName={clientName || "Cliente Exemplo"}
              imageClassName="clinic-preview__logo"
              placeholderClassName="clinic-preview__logo clinic-preview__logo--placeholder"
              onStatusChange={setLogoStatus}
            />
            <div className="clinic-preview__icon">WA</div>
            <strong>{clientName || "Cliente Exemplo"}</strong>
            <p>Procurando um atendente disponivel para te atender...</p>
            <span>Voce sera redirecionado para o WhatsApp em instantes.</span>
          </div>
        </article>

        <article className="dashboard-card">
          <div className="dashboard-card__header">
            <div>
              <h3>Resumo rapido</h3>
            </div>
          </div>
          <div className="dashboard-summary-list">
            <div>
              <span>Status</span>
              <strong>{isActive ? "Ativo" : "Inativo"}</strong>
            </div>
            <div>
              <span>Meta CAPI</span>
              <strong>{values.metaCapiConfigured ? "Ativa" : "Nao configurada"}</strong>
            </div>
            <div>
              <span>Slug</span>
              <strong>{normalizedCurrentSlug || "-"}</strong>
            </div>
            <div>
              <span>WhatsApp</span>
              <strong>{whatsappNumber || "-"}</strong>
            </div>
          </div>
        </article>
      </aside>
    </div>
  );
}
