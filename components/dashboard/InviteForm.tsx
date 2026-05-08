"use client";

import { useState } from "react";
import { buildWhatsAppInviteUrl } from "@/lib/invite-shared";

type Client = { clientSlug: string; clientName: string };

type Permissions = Record<string, boolean>;

// All permission keys in display order
const PERM_GROUPS = [
  {
    label: "Operacao",
    help: "Atendimento de leads e uso diario do sistema",
    keys: [
      { key: "kanban",    label: "Kanban - Leads" },
      { key: "exportar",  label: "Exportar Leads" },
      { key: "conexoes",  label: "Conexoes WhatsApp" },
    ]
  },
  {
    label: "Analise",
    help: "Visualizacao de dados e metricas",
    keys: [
      { key: "dashboard",     label: "Visao Geral" },
      { key: "performance",   label: "Performance" },
      { key: "relatorio",     label: "Relatorios" },
      { key: "investimentos", label: "Investimentos" },
      { key: "criativos",     label: "Criativos (pagina)" },
    ]
  },
  {
    label: "Marketing",
    help: "Gestao de campanhas, criativos e grupos WhatsApp",
    keys: [
      { key: "campanhas_view",   label: "Campanhas - Ver" },
      { key: "campanhas_create", label: "Campanhas - Criar" },
      { key: "campanhas_edit",   label: "Campanhas - Editar" },
      { key: "criativos_view",   label: "Criativos - Ver" },
      { key: "criativos_create", label: "Criativos - Criar" },
      { key: "criativos_edit",   label: "Criativos - Editar" },
      { key: "grupos_view",      label: "Grupos WA - Ver" },
      { key: "grupos_create",    label: "Grupos WA - Criar" },
      { key: "grupos_edit",      label: "Grupos WA - Editar" },
      { key: "disparos",         label: "Disparos em Massa" },
    ]
  },
  {
    label: "Administracao",
    help: "Gerenciamento de usuarios e clientes",
    keys: [
      { key: "clientes",  label: "Clientes" },
      { key: "usuarios",  label: "Usuarios" },
    ]
  },
] as const;

const ALL_KEYS = PERM_GROUPS.flatMap((g) => g.keys.map((k) => k.key));

function defaultPermissions(role: string): Permissions {
  const none = Object.fromEntries(ALL_KEYS.map((k) => [k, false]));

  if (role === "agency_admin") return Object.fromEntries(ALL_KEYS.map((k) => [k, true]));

  if (role === "client_owner") {
    return {
      ...none,
      dashboard: true, kanban: true, performance: true,
      relatorio: true, criativos: true, exportar: true,
      campanhas_view: true, campanhas_create: true, campanhas_edit: true,
      criativos_view: true, criativos_create: true, criativos_edit: true,
      grupos_view: true, grupos_create: true, grupos_edit: true,
    };
  }

  if (role === "operator") {
    return {
      ...none,
      kanban: true,
      campanhas_view: true,
      criativos_view: true,
      grupos_view: true,
    };
  }

  // client_user
  return { ...none, dashboard: true, kanban: true, performance: true };
}

type SuccessData = { inviteUrl: string; phone: string | null };

export function InviteForm({ clients }: { clients: Client[] }) {
  const [role, setRole] = useState("client_owner");
  const [perms, setPerms] = useState<Permissions>(() => defaultPermissions("client_owner"));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<SuccessData | null>(null);
  const [copied, setCopied] = useState(false);

  function handleRoleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newRole = e.target.value;
    setRole(newRole);
    setPerms(defaultPermissions(newRole));
  }

  function togglePerm(key: string) {
    setPerms((p) => ({ ...p, [key]: !p[key] }));
  }

  function toggleGroup(groupKeys: readonly { key: string; label: string }[]) {
    const allOn = groupKeys.every((k) => perms[k.key]);
    setPerms((p) => ({
      ...p,
      ...Object.fromEntries(groupKeys.map((k) => [k.key, !allOn]))
    }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const body: Record<string, unknown> = {
      name: fd.get("name") || null,
      email: fd.get("email"),
      role: fd.get("role"),
      clientSlug: fd.get("clientSlug") || null,
      phone: fd.get("phone") || null,
      permissions: Object.fromEntries(ALL_KEYS.map((k) => [k, perms[k] ?? false]))
    };

    try {
      const res = await fetch("/api/users/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const data = await res.json() as { inviteUrl?: string; phone?: string | null; error?: string };
      if (!res.ok || data.error) {
        setError(data.error ?? "Erro ao criar convite.");
        return;
      }
      setSuccess({ inviteUrl: data.inviteUrl!, phone: data.phone ?? null });
      (e.target as HTMLFormElement).reset();
      setPerms(defaultPermissions("client_owner"));
      setRole("client_owner");
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

  return (
    <>
      <form onSubmit={handleSubmit} className="dashboard-form-grid">
        <label className="dashboard-field">
          <span>Nome</span>
          <input type="text" name="name" required placeholder="Ex: Clinica Bem Estar, Joao Silva..." />
        </label>

        <label className="dashboard-field">
          <span>E-mail</span>
          <input type="email" name="email" required placeholder="usuario@empresa.com" />
        </label>

        <label className="dashboard-field">
          <span>Perfil</span>
          <select name="role" value={role} onChange={handleRoleChange} required>
            <option value="agency_admin">Agency Admin</option>
            <option value="client_owner">Gestor de Trafego</option>
            <option value="operator">Operador</option>
          </select>
        </label>

        <label className="dashboard-field">
          <span>Cliente</span>
          <select name="clientSlug">
            <option value="">Sem restricao</option>
            {clients.map((c) => (
              <option key={c.clientSlug} value={c.clientSlug}>{c.clientName}</option>
            ))}
          </select>
        </label>

        <label className="dashboard-field">
          <span>Telefone (WhatsApp)</span>
          <input type="tel" name="phone" placeholder="(11) 99999-9999" />
        </label>

        <div className="dashboard-field dashboard-field--full">
          <span className="dashboard-field__label">Permissoes</span>
          <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 8 }}>
            {PERM_GROUPS.map((group) => {
              const allOn = group.keys.every((k) => perms[k.key]);
              return (
                <div key={group.label} style={{ background: "var(--bg-subtle, #f9fafb)", border: "1px solid var(--border)", borderRadius: 8, padding: "12px 14px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                    <div>
                      <strong style={{ fontSize: "0.82rem" }}>{group.label}</strong>
                      <span style={{ fontSize: "0.74rem", color: "var(--muted)", marginLeft: 8 }}>{group.help}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleGroup(group.keys)}
                      style={{ fontSize: "0.72rem", padding: "2px 8px", background: "transparent", border: "1px solid var(--border)", borderRadius: 4, cursor: "pointer", color: "var(--muted)" }}
                    >
                      {allOn ? "Desmarcar todos" : "Marcar todos"}
                    </button>
                  </div>
                  <div className="invite-perms-grid">
                    {group.keys.map(({ key, label }) => (
                      <label key={key} className="invite-perm-check">
                        <input
                          type="checkbox"
                          name={`perm_${key}`}
                          value="1"
                          checked={perms[key] ?? false}
                          onChange={() => togglePerm(key)}
                        />
                        <span>{label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {error ? <div className="dashboard-alert dashboard-alert--error dashboard-field--full">{error}</div> : null}

        <div className="dashboard-actions dashboard-field--full">
          <button type="submit" className="dashboard-button dashboard-button--brand" disabled={saving}>
            {saving ? "Criando convite..." : "Convidar usuario"}
          </button>
        </div>
      </form>

      {success ? (
        <div className="dashboard-modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) setSuccess(null); }}>
          <div className="dashboard-modal" style={{ maxWidth: 480 }}>
            <h3 style={{ color: "#15803d", marginBottom: 4 }}>Convite criado com sucesso!</h3>

            <p style={{ color: "var(--muted)", fontSize: "0.85rem", marginBottom: 16 }}>
              Copie o link ou envie diretamente pelo WhatsApp.
            </p>

            <div style={{ background: "var(--bg-subtle, #f9fafb)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 12px", marginBottom: 14 }}>
              <p style={{ fontSize: "0.7rem", color: "var(--muted)", margin: "0 0 4px" }}>Link do convite:</p>
              <code style={{ fontSize: "0.78rem", wordBreak: "break-all" }}>{success.inviteUrl}</code>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <button
                type="button"
                className="dashboard-button"
                onClick={copyLink}
              >
                {copied ? "Copiado!" : "Copiar link"}
              </button>

              {waUrl ? (
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="dashboard-button"
                  style={{ background: "#25d366", color: "#fff", textAlign: "center", textDecoration: "none" }}
                >
                  Enviar por WhatsApp
                </a>
              ) : null}

              <button
                type="button"
                className="dashboard-button dashboard-button--ghost"
                onClick={() => setSuccess(null)}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
