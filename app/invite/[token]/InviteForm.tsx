"use client";

import { useState } from "react";

function EyeIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 16, height: 16 }}>
      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 16, height: 16 }}>
      <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
      <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
    </svg>
  );
}

function formatPhone(value: string) {
  const d = value.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 10) return d.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3").replace(/-$/, "");
  return d.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3").replace(/-$/, "");
}

function formatCpfCnpj(value: string) {
  const d = value.replace(/\D/g, "").slice(0, 14);
  if (d.length <= 11) {
    return d.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, "$1.$2.$3-$4")
      .replace(/(\d{3})(\d{3})(\d{1,3})/, "$1.$2.$3")
      .replace(/(\d{3})(\d{1,3})/, "$1.$2");
  }
  return d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{1,2})/, "$1.$2.$3/$4-$5")
    .replace(/(\d{2})(\d{3})(\d{3})(\d{1,4})/, "$1.$2.$3/$4")
    .replace(/(\d{2})(\d{3})(\d{1,3})/, "$1.$2.$3")
    .replace(/(\d{2})(\d{1,3})/, "$1.$2");
}

type Props = {
  token: string;
  invite: { email: string; phone: string | null; name: string | null };
};

export function InviteForm({ token, invite }: Props) {
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState(invite.phone ?? "");
  const [cpfCnpj, setCpfCnpj] = useState("");
  const [loading, setLoading] = useState(false);

  return (
    <form
      action="/api/auth/accept-invite"
      method="post"
      className="auth-page-form"
      onSubmit={() => setLoading(true)}
    >
      <input type="hidden" name="token" value={token} />

      <label className="dashboard-field">
        <span>Nome completo</span>
        <input
          type="text"
          name="name"
          defaultValue={invite.name ?? ""}
          placeholder="Seu nome completo"
          autoComplete="name"
          autoFocus
          required
        />
      </label>

      <label className="dashboard-field">
        <span>E-mail</span>
        <input
          type="email"
          value={invite.email}
          readOnly
          disabled
          style={{ opacity: 0.7, cursor: "not-allowed" }}
        />
      </label>

      <label className="dashboard-field">
        <span>Celular (WhatsApp)</span>
        <input
          type="tel"
          name="phone"
          value={phone}
          onChange={(e) => setPhone(formatPhone(e.target.value))}
          placeholder="(11) 99999-9999"
          autoComplete="tel"
          inputMode="numeric"
          required
        />
      </label>

      <label className="dashboard-field">
        <span>CPF ou CNPJ</span>
        <input
          type="text"
          name="cpf_cnpj"
          value={cpfCnpj}
          onChange={(e) => setCpfCnpj(formatCpfCnpj(e.target.value))}
          placeholder="000.000.000-00 ou 00.000.000/0001-00"
          inputMode="numeric"
          required
        />
      </label>

      <label className="dashboard-field">
        <span>Crie uma senha</span>
        <div className="dashboard-password-wrap">
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            placeholder="Mínimo 6 caracteres"
            autoComplete="new-password"
            required
            minLength={6}
          />
          <button
            type="button"
            className="dashboard-password-eye"
            onClick={() => setShowPassword((v) => !v)}
            tabIndex={-1}
            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
          >
            {showPassword ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        </div>
      </label>

      <button
        type="submit"
        className="dashboard-button dashboard-button--brand"
        disabled={loading}
        style={{ marginTop: 4, height: 42 }}
      >
        {loading ? "Entrando..." : "Criar conta e entrar"}
      </button>

      <p style={{ marginTop: 10, fontSize: "0.75rem", color: "var(--muted)", textAlign: "center" }}>
        Esqueceu a senha depois?{" "}
        <a href="/redefinir-senha" style={{ color: "var(--brand)", textDecoration: "none" }}>
          Redefinir senha
        </a>
      </p>
    </form>
  );
}
