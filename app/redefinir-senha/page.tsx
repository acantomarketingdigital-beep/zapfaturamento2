import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function param(v: string | string[] | undefined): string {
  return Array.isArray(v) ? (v[0] ?? "") : (v ?? "");
}

export default async function ForgotPasswordPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const sent = param(params.sent) === "1";

  return (
    <main className="auth-page-shell">
      <div className="auth-page-card">
        <BrandLogo variant="horizontal" className="auth-page-card__logo" priority />
        <h1>Esqueci minha senha</h1>

        {sent ? (
          <>
            <div className="auth-page-card__notice">
              Se esse e-mail estiver cadastrado, enviaremos um link para redefinir sua senha.
              Verifique sua caixa de entrada.
            </div>
            <Link href="/login" className="dashboard-button dashboard-button--ghost" style={{ marginTop: 8 }}>
              Voltar ao login
            </Link>
          </>
        ) : (
          <>
            <p className="auth-page-card__lead">
              Informe seu e-mail para receber o link de redefinicao de senha.
            </p>

            <form action="/api/auth/request-reset" method="post" className="auth-page-form">
              <label className="dashboard-field">
                <span>E-mail</span>
                <input
                  type="email"
                  name="email"
                  placeholder="voce@empresa.com"
                  required
                  autoComplete="email"
                />
              </label>

              <button
                type="submit"
                className="dashboard-button dashboard-button--brand"
                style={{ marginTop: 4, height: 42 }}
              >
                Enviar link de redefinicao
              </button>
            </form>

            <div style={{ marginTop: 16, textAlign: "center" }}>
              <Link href="/login" className="auth-page-card__back-link">
                Voltar ao login
              </Link>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
