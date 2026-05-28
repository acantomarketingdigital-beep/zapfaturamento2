"use client";

import { useState } from "react";
import { buildWhatsAppInviteUrl } from "@/lib/invite-shared";

type Client = { clientSlug: string; clientName: string };
type Permissions = Record<string, boolean>;

const ALL_PERM_KEYS = [
  "kanban","exportar","conexoes","dashboard","performance","relatorio",
  "investimentos","criativos","campanhas_view","campanhas_create","campanhas_edit",
  "criativos_view","criativos_create","criativos_edit","grupos_view","grupos_create",
  "grupos_edit","disparos","clientes","usuarios",
] as const;

type PermKey = typeof ALL_PERM_KEYS[number];

// ─── Role definitions with plain Portuguese ────────────────────────────────

const ROLES = [
  {
    key: "client_owner",
    icon: "🏢",
    label: "Dono do negócio",
    sublabel: "Ex: dono da clínica, empresário, cliente da agência",
    desc: "Acessa tudo do negócio dele: Kanban, relatórios, campanhas, WhatsApp. Pode convidar a equipe dele.",
    color: "#3b82f6",
    bg: "#eff6ff",
    border: "#bfdbfe",
    needsClient: true,
  },
  {
    key: "operator",
    icon: "🎧",
    label: "Atendente / Secretaria",
    sublabel: "Ex: secretária, recepcionista, atendente de WhatsApp",
    desc: "Acessa o Kanban de leads e o WhatsApp para atender clientes. Não vê campanhas nem relatórios financeiros.",
    color: "#8b5cf6",
    bg: "#f5f3ff",
    border: "#c4b5fd",
    needsClient: true,
  },
  {
    key: "agency_admin",
    icon: "👤",
    label: "Parceiro / Co-administrador",
    sublabel: "Ex: sócio, colaborador da agência com acesso total",
    desc: "Acesso completo igual ao seu. Use apenas para parceiros de confiança.",
    color: "#6b7280",
    bg: "#f9fafb",
    border: "#d1d5db",
    needsClient: false,
  },
] as const;

function defaultPermissions(role: string): Permissions {
  const none = Object.fromEntries(ALL_PERM_KEYS.map((k) => [k, false]));
  if (role === "agency_admin") return Object.fromEntries(ALL_PERM_KEYS.map((k) => [k, true]));
  if (role === "client_owner") return {
    ...none,
    dashboard: true, kanban: true, performance: true, relatorio: true,
    criativos: true, exportar: true,
    campanhas_view: true, campanhas_create: true, campanhas_edit: true,
    criativos_view: true, criativos_create: true, criativos_edit: true,
    grupos_view: true, grupos_create: true, grupos_edit: true,
    conexoes: true,
  };
  if (role === "operator") return {
    ...none, kanban: true, campanhas_view: true, criativos_view: true, grupos_view: true,
  };
  return { ...none, dashboard: true, kanban: true, performance: true };
}

const PERM_GROUPS = [
  {
    label: "Atendimento",
    keys: [
      { key: "kanban" as PermKey, label: "Kanban de leads" },
      { key: "exportar" as PermKey, label: "Exportar leads" },
      { key: "conexoes" as PermKey, label: "WhatsApp (conexões)" },
    ]
  },
  {
    label: "Análise",
    keys: [
      { key: "dashboard" as PermKey, label: "Visão geral" },
      { key: "performance" as PermKey, label: "Performance" },
      { key: "relatorio" as PermKey, label: "Relatórios" },
      { key: "investimentos" as PermKey, label: "Investimentos" },
      { key: "criativos" as PermKey, label: "Criativos (página)" },
    ]
  },
  {
    label: "Marketing",
    keys: [
      { key: "campanhas_view" as PermKey, label: "Ver campanhas" },
      { key: "campanhas_create" as PermKey, label: "Criar campanhas" },
      { key: "campanhas_edit" as PermKey, label: "Editar campanhas" },
      { key: "criativos_view" as PermKey, label: "Ver criativos" },
      { key: "criativos_create" as PermKey, label: "Criar criativos" },
      { key: "criativos_edit" as PermKey, label: "Editar criativos" },
      { key: "grupos_view" as PermKey, label: "Ver grupos WA" },
      { key: "grupos_create" as PermKey, label: "Criar grupos WA" },
      { key: "grupos_edit" as PermKey, label: "Editar grupos WA" },
      { key: "disparos" as PermKey, label: "Disparos em massa" },
    ]
  },
  {
    label: "Administração",
    keys: [
      { key: "clientes" as PermKey, label: "Gerenciar clientes" },
      { key: "usuarios" as PermKey, label: "Gerenciar usuários" },
    ]
  },
];

type SuccessData = { inviteUrl: string; phone: string | null };

export function InviteForm({ clients }: { clients: Client[] }) {
  const [selectedRole, setSelectedRole] = useState<string>("client_owner");
  const [perms, setPerms] = useState<Permissions>(() => defaultPermissions("client_owner"));
  const [showPerms, setShowPerms] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<SuccessData | null>(null);
  const [copied, setCopied] = useState(false);

  const roleInfo = ROLES.find((r) => r.key === selectedRole) ?? ROLES[0];

  function handleRoleSelect(key: string) {
    setSelectedRole(key);
    setPerms(defaultPermissions(key));
    setShowPerms(false);
  }

  function togglePerm(key: PermKey) {
    setPerms((p) => ({ ...p, [key]: !p[key] }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const body: Record<string, unknown> = {
      name: fd.get("name") || null,
      email: fd.get("email"),
      role: selectedRole,
      clientSlug: fd.get("clientSlug") || null,
      phone: fd.get("phone") || null,
      permissions: Object.fromEntries(ALL_PERM_KEYS.map((k) => [k, perms[k] ?? false]))
    };
    try {
      const res = await fetch("/api/users/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const data = await res.json() as { inviteUrl?: string; phone?: string | null; error?: string };
      if (!res.ok || data.error) { setError(data.error ?? "Erro ao criar convite."); return; }
      setSuccess({ inviteUrl: data.inviteUrl!, phone: data.phone ?? null });
      (e.target as HTMLFormElement).reset();
      setSelectedRole("client_owner");
      setPerms(defaultPermissions("client_owner"));
    } catch {
      setError("Erro de rede.");
    } finally {
      setSaving(false);
    }
  }

  function copyLink() {
    if (!success) return;
    navigator.clipboard.writeText(success.inviteUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const waUrl = success?.phone ? buildWhatsAppInviteUrl(success.phone, success.inviteUrl) : null;
  const activePermsCount = Object.values(perms).filter(Boolean).length;

  return (
    <>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 24 }}>

        {/* Step 1 — choose role */}
        <div>
          <p style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>
            1 · Quem você está convidando?
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {ROLES.map((r) => (
              <button
                key={r.key}
                type="button"
                onClick={() => handleRoleSelect(r.key)}
                style={{
                  display: "flex", alignItems: "flex-start", gap: 12, textAlign: "left",
                  padding: "12px 14px", borderRadius: 10, cursor: "pointer",
                  border: `2px solid ${selectedRole === r.key ? r.color : "var(--border)"}`,
                  background: selectedRole === r.key ? r.bg : "var(--surface)",
                  transition: "all 0.15s",
                }}
              >
                <span style={{ fontSize: "1.4rem", lineHeight: 1, marginTop: 2 }}>{r.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: "0.9rem", color: selectedRole === r.key ? r.color : "var(--dark)" }}>
                    {r.label}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: 1 }}>{r.sublabel}</div>
                  <div style={{ fontSize: "0.77rem", color: "var(--dark)", marginTop: 4, lineHeight: 1.4 }}>{r.desc}</div>
                </div>
                <div style={{
                  width: 18, height: 18, borderRadius: "50%", flexShrink: 0, marginTop: 2,
                  border: `2px solid ${selectedRole === r.key ? r.color : "var(--border)"}`,
                  background: selectedRole === r.key ? r.color : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {selectedRole === r.key && (
                    <svg viewBox="0 0 10 10" fill="none" style={{ width: 8, height: 8 }}>
                      <path d="M1.5 5L4 7.5L8.5 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Step 2 — contact info */}
        <div>
          <p style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>
            2 · Dados de contato
          </p>
          <div className="dashboard-form-grid" style={{ gap: 12 }}>
            <label className="dashboard-field">
              <span>Nome</span>
              <input type="text" name="name" required placeholder="Ex: Maria, Clínica Bem Estar..." />
            </label>
            <label className="dashboard-field">
              <span>E-mail</span>
              <input type="email" name="email" required placeholder="email@exemplo.com" />
            </label>
            <label className="dashboard-field">
              <span>WhatsApp (para enviar o convite)</span>
              <input type="tel" name="phone" placeholder="(11) 99999-9999" />
            </label>
          </div>
        </div>

        {/* Step 3 — client (only when needed) */}
        {roleInfo.needsClient && clients.length > 0 && (
          <div>
            <p style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>
              3 · De qual negócio é essa pessoa?
            </p>
            <label className="dashboard-field" style={{ marginBottom: 0 }}>
              <span>Negócio / Cliente</span>
              <select name="clientSlug" required={roleInfo.needsClient}>
                <option value="">Selecione o negócio...</option>
                {clients.map((c) => (
                  <option key={c.clientSlug} value={c.clientSlug}>{c.clientName}</option>
                ))}
              </select>
            </label>
            <p style={{ fontSize: "0.74rem", color: "var(--muted)", marginTop: 6 }}>
              A pessoa terá acesso <strong>apenas</strong> a esse negócio, não verá os outros.
            </p>
          </div>
        )}

        {/* Permissions summary + advanced toggle */}
        <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 10, padding: "12px 14px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: showPerms ? 12 : 0 }}>
            <div>
              <span style={{ fontSize: "0.84rem", fontWeight: 600, color: "var(--dark)" }}>
                Permissões — {activePermsCount} de {ALL_PERM_KEYS.length} ativas
              </span>
              <span style={{ fontSize: "0.74rem", color: "var(--muted)", marginLeft: 8 }}>
                Pré-definidas para "{roleInfo.label}"
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowPerms((v) => !v)}
              style={{ fontSize: "0.75rem", padding: "4px 10px", background: "transparent", border: "1px solid var(--border)", borderRadius: 6, cursor: "pointer", color: "var(--muted)", whiteSpace: "nowrap" }}
            >
              {showPerms ? "Fechar" : "Personalizar"}
            </button>
          </div>

          {showPerms && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {PERM_GROUPS.map((group) => (
                <div key={group.label}>
                  <div style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--muted)", marginBottom: 6 }}>
                    {group.label}
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {group.keys.map(({ key, label }) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => togglePerm(key)}
                        style={{
                          padding: "4px 10px", borderRadius: 20, fontSize: "0.75rem", cursor: "pointer",
                          fontWeight: perms[key] ? 700 : 400,
                          background: perms[key] ? "var(--brand)" : "var(--surface)",
                          color: perms[key] ? "#fff" : "var(--muted)",
                          border: `1px solid ${perms[key] ? "var(--brand)" : "var(--border)"}`,
                          transition: "all 0.12s",
                        }}
                      >
                        {perms[key] ? "✓ " : ""}{label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {error && <div className="dashboard-alert dashboard-alert--error">{error}</div>}

        <button
          type="submit"
          className="dashboard-button dashboard-button--brand"
          disabled={saving}
          style={{ height: 44, fontSize: "0.92rem" }}
        >
          {saving ? "Gerando link de convite..." : `Convidar ${roleInfo.label}`}
        </button>
      </form>

      {success && (
        <div className="dashboard-modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) setSuccess(null); }}>
          <div className="dashboard-modal" style={{ maxWidth: 480 }}>
            <div style={{ fontSize: "1.5rem", marginBottom: 8 }}>✅</div>
            <h3 style={{ color: "#15803d", marginBottom: 4 }}>Convite gerado!</h3>
            <p style={{ color: "var(--muted)", fontSize: "0.85rem", marginBottom: 16 }}>
              Envie o link abaixo para a pessoa. Ela vai criar a senha e acessar o sistema.
            </p>

            <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 12px", marginBottom: 14 }}>
              <p style={{ fontSize: "0.7rem", color: "var(--muted)", margin: "0 0 4px" }}>Link do convite (válido por 48h):</p>
              <code style={{ fontSize: "0.78rem", wordBreak: "break-all" }}>{success.inviteUrl}</code>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {waUrl && (
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="dashboard-button"
                  style={{ background: "#25d366", color: "#fff", textAlign: "center", textDecoration: "none", fontWeight: 700 }}
                >
                  📱 Enviar pelo WhatsApp
                </a>
              )}
              <button type="button" className="dashboard-button" onClick={copyLink}>
                {copied ? "✓ Copiado!" : "Copiar link"}
              </button>
              <button type="button" className="dashboard-button dashboard-button--ghost" onClick={() => setSuccess(null)}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
