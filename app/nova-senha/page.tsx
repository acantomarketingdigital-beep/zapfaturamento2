import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function param(v: string | string[] | undefined): string {
  return Array.isArray(v) ? (v[0] ?? "") : (v ?? "");
}

export default async function NewPasswordPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const token = param(params.token);
  const error = param(params.error);
  const success = param(params.success);

  if (!token && !success) {
    return (
      <main className="auth-page-shell">
        <div className="auth-page-card">
          <BrandLogo variant="horizontal" className="auth-page-card__logo" priority />
          <h1>Link invalido</h1>
          <p className="auth-page-card__lead">
            Este link de redefinicao e invalido ou ja foi utilizado.
          </p>
          <Link href="/redefinir-senha" className="dashboard-button" style={{ marginTop: 8 }}>
            Solicitar novo link
          </Link>
        </div>
      </main>
    );
  }

  if (success === "1") {
    return (
      <main className="auth-page-shell">
        <div className="auth-page-card">
          <BrandLogo variant="horizontal" className="auth-page-card__logo" priority />
          <div className="auth-page-card__success">
            <span className="auth-page-card__success-icon">✓</span>
            <h1>Senha redefinida!</h1>
          </div>
          <p className="auth-page-card__lead">
            Sua nova senha foi salva com sucesso.
          </p>
          <Link href="/login" className="dashboard-button" style={{ marginTop: 8 }}>
            Entrar no painel
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="auth-page-shell">
      <div className="auth-page-card">
        <BrandLogo variant="horizontal" className="auth-page-card__logo" priority />
        <h1>Nova senha</h1>
        <p className="auth-page-card__lead">
          Escolha uma nova senha para sua conta.
        </p>

        {error ? (
          <div className="dashboard-alert dashboard-alert--error">{decodeURIComponent(error)}</div>
        ) : null}

        <form action="/api/auth/reset-password" method="post" className="auth-page-form">
          <input type="hidden" name="token" value={token} />

          <label className="dashboard-field">
            <span>Nova senha</span>
            <input
              type="password"
              name="password"
              placeholder="Minimo 6 caracteres"
              required
              minLength={6}
              autoComplete="new-password"
            />
          </label>

          <label className="dashboard-field">
            <span>Confirmar senha</span>
            <input
              type="password"
              name="confirmPassword"
              placeholder="Repita a senha"
              required
              minLength={6}
              autoComplete="new-password"
            />
          </label>

          <button
            type="submit"
            className="dashboard-button dashboard-button--brand"
            style={{ marginTop: 4, height: 42 }}
          >
            Salvar nova senha
          </button>
        </form>

        <div style={{ marginTop: 16, textAlign: "center" }}>
          <Link href="/redefinir-senha" className="auth-page-card__back-link">
            Solicitar novo link
          </Link>
        </div>
      </div>
    </main>
  );
}
