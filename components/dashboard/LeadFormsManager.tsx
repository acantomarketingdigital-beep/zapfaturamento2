"use client";

import { useRef, useState } from "react";
import type { LeadForm } from "@/lib/lead-forms";
import { CopyButton } from "@/components/dashboard/CopyButton";

type Client = { slug: string; name: string };

type Props = {
  initialForms: LeadForm[];
  clients: Client[];
  currentClientSlug: string | null;
  isAgencyAdmin: boolean;
  baseUrl: string;
  limit: number;
};

type ModalState = {
  mode: "create" | "edit";
  id?: string;
  clientSlug: string;
  name: string;
  slug: string;
  title: string;
  subtitle: string;
  buttonText: string;
  logoUrl: string;
  imageUrl: string;
  primaryColor: string;
  backgroundColor: string;
  status: "active" | "inactive";
  successMessage: string;
  showEmail: boolean;
  showProcedure: boolean;
  showCity: boolean;
  showObservation: boolean;
  slugTouched: boolean;
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function emptyModal(clientSlug: string): ModalState {
  return {
    mode: "create",
    clientSlug,
    name: "",
    slug: "",
    title: "",
    subtitle: "",
    buttonText: "Enviar",
    logoUrl: "",
    imageUrl: "",
    primaryColor: "#16a34a",
    backgroundColor: "#f0fdf4",
    status: "active",
    successMessage: "Cadastro enviado! Nossa equipe entrara em contato em breve.",
    showEmail: false,
    showProcedure: false,
    showCity: false,
    showObservation: false,
    slugTouched: false,
  };
}

export function LeadFormsManager({
  initialForms,
  clients,
  currentClientSlug,
  isAgencyAdmin,
  baseUrl,
  limit,
}: Props) {
  const [forms, setForms]   = useState<LeadForm[]>(initialForms);
  const [modal, setModal]   = useState<ModalState | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");

  const [logoUploading, setLogoUploading]       = useState(false);
  const [logoUploadError, setLogoUploadError]   = useState("");
  const [logoPreview, setLogoPreview]           = useState<string | null>(null);
  const [bannerUploading, setBannerUploading]   = useState(false);
  const [bannerUploadError, setBannerUploadError] = useState("");
  const [bannerPreview, setBannerPreview]       = useState<string | null>(null);
  const logoInputRef   = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const defaultClient = currentClientSlug ?? clients[0]?.slug ?? "";

  async function handleImageUpload(
    file: File,
    field: "logoUrl" | "imageUrl",
    setUploading: (v: boolean) => void,
    setUploadError: (v: string) => void,
    setPreview: (v: string | null) => void,
  ) {
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    setUploadError("");
    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const res  = await fetch("/api/upload/logo", { method: "POST", body });
      const data = await res.json() as { url?: string; error?: string };
      if (!res.ok) throw new Error(data.error || "Erro ao fazer upload.");
      setModal((m) => m ? { ...m, [field]: data.url || "" } : m);
      setPreview(null);
      URL.revokeObjectURL(objectUrl);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Erro ao fazer upload.");
      setPreview(null);
      URL.revokeObjectURL(objectUrl);
    } finally {
      setUploading(false);
    }
  }

  function resetUploadState() {
    setLogoUploading(false); setLogoUploadError(""); setLogoPreview(null);
    setBannerUploading(false); setBannerUploadError(""); setBannerPreview(null);
  }

  function openCreate() {
    setError("");
    resetUploadState();
    setModal(emptyModal(defaultClient));
  }

  function openEdit(f: LeadForm) {
    setError("");
    resetUploadState();
    setModal({
      mode: "edit",
      id: f.id,
      clientSlug: f.clientSlug,
      name: f.name,
      slug: f.slug,
      title: f.title,
      subtitle: f.subtitle,
      buttonText: f.buttonText,
      logoUrl: f.logoUrl ?? "",
      imageUrl: f.imageUrl ?? "",
      primaryColor: f.primaryColor,
      backgroundColor: f.backgroundColor,
      status: f.status,
      successMessage: f.successMessage,
      showEmail: f.showEmail,
      showProcedure: f.showProcedure,
      showCity: f.showCity,
      showObservation: f.showObservation,
      slugTouched: true,
    });
  }

  async function handleSave() {
    if (!modal) return;
    setError("");
    setSaving(true);

    const payload = {
      clientSlug:      modal.clientSlug,
      name:            modal.name.trim(),
      slug:            modal.slug.trim() || slugify(modal.name),
      title:           modal.title.trim(),
      subtitle:        modal.subtitle.trim(),
      buttonText:      modal.buttonText.trim() || "Enviar",
      logoUrl:         modal.logoUrl.trim() || null,
      imageUrl:        modal.imageUrl.trim() || null,
      primaryColor:    modal.primaryColor,
      backgroundColor: modal.backgroundColor,
      status:          modal.status,
      successMessage:  modal.successMessage.trim(),
      showEmail:       modal.showEmail,
      showProcedure:   modal.showProcedure,
      showCity:        modal.showCity,
      showObservation: modal.showObservation,
    };

    try {
      const url    = modal.mode === "edit" ? `/api/lead-forms/${modal.id}` : "/api/lead-forms";
      const method = modal.mode === "edit" ? "PATCH" : "POST";
      const res    = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error((data as { error?: string }).error || "Erro ao salvar.");

      const saved = (data as { form: LeadForm }).form;
      setForms((prev) =>
        modal.mode === "edit"
          ? prev.map((f) => (f.id === saved.id ? saved : f))
          : [saved, ...prev]
      );
      setModal(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(f: LeadForm) {
    const res  = await fetch(`/api/lead-forms/${f.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: f.status === "active" ? "inactive" : "active" }),
    });
    const data = await res.json();
    if (res.ok) {
      const updated = (data as { form: LeadForm }).form;
      setForms((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
    }
  }

  async function handleDelete(f: LeadForm) {
    if (!confirm(`Remover formulario "${f.name}"? Esta acao nao pode ser desfeita.`)) return;
    const res = await fetch(`/api/lead-forms/${f.id}`, { method: "DELETE" });
    if (res.ok) setForms((prev) => prev.filter((x) => x.id !== f.id));
  }

  const atLimit = forms.length >= limit;

  return (
    <div>
      {/* Header */}
      <div className="dashboard-section-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <span className="dashboard-table__sub">
          {forms.length} / {limit} formularios
        </span>
        <button
          type="button"
          className="dashboard-button"
          onClick={openCreate}
          disabled={atLimit}
          title={atLimit ? `Limite de ${limit} formularios atingido` : undefined}
        >
          + Novo formulario
        </button>
      </div>

      {atLimit ? (
        <div className="dashboard-alert dashboard-alert--warning" style={{ marginBottom: 16 }}>
          Limite de {limit} formularios atingido. Remova um formulario para criar outro.
        </div>
      ) : null}

      {forms.length === 0 ? (
        <div className="dashboard-empty">
          <p>Nenhum formulario criado ainda.</p>
          <p>Crie seu primeiro formulario para captar leads sem landing page.</p>
        </div>
      ) : (
        <div className="lf-admin-list">
          {forms.map((f) => {
            const publicUrl = `${baseUrl}/f/${encodeURIComponent(f.clientSlug)}/${encodeURIComponent(f.slug)}`;
            return (
              <div key={f.id} className="lf-admin-card">
                <div className="lf-admin-card__header">
                  <div>
                    <strong className="lf-admin-card__name">{f.name}</strong>
                    <code className="dashboard-inline-code">/{f.slug}</code>
                  </div>
                  <span className={`dashboard-pill ${f.status === "active" ? "dashboard-pill--success" : "dashboard-pill--error"}`}>
                    {f.status === "active" ? "Ativo" : "Inativo"}
                  </span>
                </div>

                {f.title ? <p className="lf-admin-card__title">{f.title}</p> : null}

                <div className="dashboard-creative-link-row" style={{ marginTop: 8 }}>
                  <span className="dashboard-table__sub">Link publico</span>
                  <code className="dashboard-code-block">{publicUrl}</code>
                  <CopyButton value={publicUrl} label="Copiar" />
                </div>

                <div className="lf-admin-card__optional-fields">
                  {f.showEmail       ? <span className="dashboard-pill">E-mail</span>        : null}
                  {f.showProcedure   ? <span className="dashboard-pill">Procedimento</span>  : null}
                  {f.showCity        ? <span className="dashboard-pill">Cidade</span>         : null}
                  {f.showObservation ? <span className="dashboard-pill">Observacao</span>     : null}
                </div>

                <div className="dashboard-inline-actions" style={{ marginTop: 10 }}>
                  <button
                    type="button"
                    className="dashboard-button dashboard-button--ghost"
                    onClick={() => window.open(publicUrl, "_blank")}
                  >
                    Visualizar
                  </button>
                  <button
                    type="button"
                    className="dashboard-button dashboard-button--ghost"
                    onClick={() => openEdit(f)}
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    className="dashboard-button dashboard-button--ghost"
                    onClick={() => handleToggle(f)}
                  >
                    {f.status === "active" ? "Desativar" : "Ativar"}
                  </button>
                  {isAgencyAdmin ? (
                    <button
                      type="button"
                      className="dashboard-button dashboard-button--ghost dashboard-button--danger"
                      onClick={() => handleDelete(f)}
                    >
                      Remover
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {modal ? (
        <div className="dashboard-modal-overlay" onClick={() => setModal(null)}>
          <div
            className="dashboard-modal"
            style={{ maxWidth: 600 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="dashboard-modal__header">
              <h3>{modal.mode === "create" ? "Novo formulario" : "Editar formulario"}</h3>
              <button type="button" className="dashboard-modal__close" onClick={() => setModal(null)}>×</button>
            </div>

            <div className="dashboard-modal__body">
              {/* Client selector (agency admin only) */}
              {isAgencyAdmin && clients.length > 1 ? (
                <label className="dashboard-field">
                  <span>Cliente</span>
                  <select
                    className="dashboard-select"
                    value={modal.clientSlug}
                    onChange={(e) => setModal((m) => m ? { ...m, clientSlug: e.target.value } : m)}
                    disabled={modal.mode === "edit"}
                  >
                    {clients.map((c) => (
                      <option key={c.slug} value={c.slug}>{c.name}</option>
                    ))}
                  </select>
                </label>
              ) : null}

              <div className="dashboard-form-grid">
                <label className="dashboard-field">
                  <span>Nome interno *</span>
                  <input
                    type="text"
                    className="dashboard-input"
                    placeholder="Ex: Botox Maes"
                    value={modal.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      setModal((m) => m ? {
                        ...m,
                        name,
                        slug: m.slugTouched ? m.slug : slugify(name),
                      } : m);
                    }}
                  />
                </label>

                <label className="dashboard-field">
                  <span>Slug</span>
                  <input
                    type="text"
                    className="dashboard-input"
                    placeholder="botox-maes"
                    value={modal.slug}
                    onChange={(e) => setModal((m) => m ? { ...m, slug: e.target.value, slugTouched: true } : m)}
                  />
                </label>
              </div>

              <label className="dashboard-field">
                <span>Titulo / Headline</span>
                <input
                  type="text"
                  className="dashboard-input"
                  placeholder="Ex: Agende sua avaliacao gratuita"
                  value={modal.title}
                  onChange={(e) => setModal((m) => m ? { ...m, title: e.target.value } : m)}
                />
              </label>

              <label className="dashboard-field">
                <span>Subtitulo</span>
                <input
                  type="text"
                  className="dashboard-input"
                  placeholder="Ex: Preencha o formulario e receba nosso contato em breve"
                  value={modal.subtitle}
                  onChange={(e) => setModal((m) => m ? { ...m, subtitle: e.target.value } : m)}
                />
              </label>

              <div className="dashboard-form-grid">
                <label className="dashboard-field">
                  <span>Texto do botao</span>
                  <input
                    type="text"
                    className="dashboard-input"
                    placeholder="Enviar"
                    value={modal.buttonText}
                    onChange={(e) => setModal((m) => m ? { ...m, buttonText: e.target.value } : m)}
                  />
                </label>

                <label className="dashboard-field">
                  <span>Status</span>
                  <select
                    className="dashboard-select"
                    value={modal.status}
                    onChange={(e) => setModal((m) => m ? { ...m, status: e.target.value as "active" | "inactive" } : m)}
                  >
                    <option value="active">Ativo</option>
                    <option value="inactive">Inativo</option>
                  </select>
                </label>
              </div>

              <label className="dashboard-field">
                <span>Mensagem de sucesso</span>
                <textarea
                  className="dashboard-input"
                  rows={2}
                  value={modal.successMessage}
                  onChange={(e) => setModal((m) => m ? { ...m, successMessage: e.target.value } : m)}
                />
              </label>

              {/* Hidden file inputs */}
              <input
                ref={logoInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                style={{ display: "none" }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(file, "logoUrl", setLogoUploading, setLogoUploadError, setLogoPreview);
                  e.target.value = "";
                }}
              />
              <input
                ref={bannerInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                style={{ display: "none" }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(file, "imageUrl", setBannerUploading, setBannerUploadError, setBannerPreview);
                  e.target.value = "";
                }}
              />

              <div className="dashboard-form-grid">
                {/* Logo upload */}
                <div className="dashboard-field">
                  <span>Logo</span>
                  <div className="dashboard-upload-zone">
                    {logoUploading ? (
                      <span className="dashboard-upload-status">Enviando...</span>
                    ) : (logoPreview || modal.logoUrl) ? (
                      <div className="dashboard-upload-actions">
                        <img
                          src={logoPreview || modal.logoUrl}
                          alt="Logo"
                          style={{ height: 48, maxWidth: 140, objectFit: "contain", borderRadius: 6 }}
                        />
                        <button
                          type="button"
                          className="dashboard-button dashboard-button--ghost"
                          onClick={() => logoInputRef.current?.click()}
                        >
                          Trocar
                        </button>
                        <button
                          type="button"
                          className="dashboard-button dashboard-button--ghost dashboard-button--danger"
                          onClick={() => setModal((m) => m ? { ...m, logoUrl: "" } : m)}
                        >
                          Remover
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="dashboard-button dashboard-button--ghost"
                        onClick={() => logoInputRef.current?.click()}
                      >
                        Selecionar logo
                      </button>
                    )}
                    {logoUploadError ? <p className="dashboard-upload-error">{logoUploadError}</p> : null}
                  </div>
                  <small className="dashboard-field__help">PNG, WEBP ou SVG, ate 2MB.</small>
                </div>

                {/* Banner upload */}
                <div className="dashboard-field">
                  <span>Banner / Imagem</span>
                  <div className="dashboard-upload-zone">
                    {bannerUploading ? (
                      <span className="dashboard-upload-status">Enviando...</span>
                    ) : (bannerPreview || modal.imageUrl) ? (
                      <div className="dashboard-upload-actions">
                        <img
                          src={bannerPreview || modal.imageUrl}
                          alt="Banner"
                          style={{ height: 48, maxWidth: 140, objectFit: "cover", borderRadius: 6 }}
                        />
                        <button
                          type="button"
                          className="dashboard-button dashboard-button--ghost"
                          onClick={() => bannerInputRef.current?.click()}
                        >
                          Trocar
                        </button>
                        <button
                          type="button"
                          className="dashboard-button dashboard-button--ghost dashboard-button--danger"
                          onClick={() => setModal((m) => m ? { ...m, imageUrl: "" } : m)}
                        >
                          Remover
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="dashboard-button dashboard-button--ghost"
                        onClick={() => bannerInputRef.current?.click()}
                      >
                        Selecionar imagem
                      </button>
                    )}
                    {bannerUploadError ? <p className="dashboard-upload-error">{bannerUploadError}</p> : null}
                  </div>
                  <small className="dashboard-field__help">PNG, WEBP ou JPG, ate 2MB.</small>
                </div>

                <label className="dashboard-field">
                  <span>Cor principal</span>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <input
                      type="color"
                      value={modal.primaryColor}
                      onChange={(e) => setModal((m) => m ? { ...m, primaryColor: e.target.value } : m)}
                      style={{ width: 40, height: 36, border: "none", borderRadius: 6, cursor: "pointer" }}
                    />
                    <input
                      type="text"
                      className="dashboard-input"
                      value={modal.primaryColor}
                      onChange={(e) => setModal((m) => m ? { ...m, primaryColor: e.target.value } : m)}
                    />
                  </div>
                </label>

                <label className="dashboard-field">
                  <span>Cor de fundo</span>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <input
                      type="color"
                      value={modal.backgroundColor}
                      onChange={(e) => setModal((m) => m ? { ...m, backgroundColor: e.target.value } : m)}
                      style={{ width: 40, height: 36, border: "none", borderRadius: 6, cursor: "pointer" }}
                    />
                    <input
                      type="text"
                      className="dashboard-input"
                      value={modal.backgroundColor}
                      onChange={(e) => setModal((m) => m ? { ...m, backgroundColor: e.target.value } : m)}
                    />
                  </div>
                </label>
              </div>

              {/* Optional fields */}
              <div className="dashboard-field">
                <span className="dashboard-field__label">Campos opcionais</span>
                <div className="lf-toggles-grid">
                  {(
                    [
                      { key: "showEmail",       label: "E-mail" },
                      { key: "showProcedure",   label: "Procedimento de interesse" },
                      { key: "showCity",        label: "Cidade" },
                      { key: "showObservation", label: "Observacao" },
                    ] as const
                  ).map(({ key, label }) => (
                    <label key={key} className="lf-toggle-item">
                      <input
                        type="checkbox"
                        checked={modal[key]}
                        onChange={(e) => setModal((m) => m ? { ...m, [key]: e.target.checked } : m)}
                      />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {error ? <p className="dashboard-error-text">{error}</p> : null}
            </div>

            <div className="dashboard-modal__footer">
              <button type="button" className="dashboard-button dashboard-button--ghost" onClick={() => setModal(null)}>
                Cancelar
              </button>
              <button type="button" className="dashboard-button" onClick={handleSave} disabled={saving}>
                {saving ? "Salvando..." : "Salvar formulario"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
