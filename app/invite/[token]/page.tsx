import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import { getInviteByToken } from "@/lib/invites";

type PageProps = {
  params: Promise<{ token: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function param(v: string | string[] | undefined): string {
  return Array.isArray(v) ? (v[0] ?? "") : (v ?? "");
}

export default async function InvitePage({ params, searchParams }: PageProps) {
  const { token } = await params;
  const sp = await searchParams;
  const error = param(sp.error);

  if (!token) {
    return <InvalidPage />;
  }

  const invite = await getInviteByToken(token);

  if (!invite) {
    return <InvalidPage />;
  }

  const isExpired = new Date(invite.invite_expires_at) < new Date();
  if (isExpired) {
    return (
      <main className="auth-page-shell">
        <div className="auth-page-card">
          <BrandLogo variant="horizontal" className="auth-page-card__logo" priority />
          <h1>Convite expirado</h1>
          <p className="auth-page-card__lead">
            Este link de convite expirou. Solicite um novo convite ao administrador.
          </p>
          <Link href="/login" className="dashboard-button" style={{ marginTop: 8 }}>
            Ir para o login
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="auth-page-shell">
      <div className="auth-page-card">
        <BrandLogo variant="horizontal" className="auth-page-card__logo" priority />
        <h1>Voce foi convidado</h1>
        <p className="auth-page-card__lead">
          Acesse o Zap Faturamento sem precisar criar senha.
        </p>

        {error ? (
          <div className="dashboard-alert dashboard-alert--error">
            {decodeURIComponent(error)}
          </div>
        ) : null}

        <form action="/api/auth/accept-invite" method="post" className="auth-page-form">
          <input type="hidden" name="token" value={token} />

          <label className="dashboard-field">
            <span>Nome</span>
            <input
              type="text"
              name="name"
              defaultValue={invite.name ?? ""}
              placeholder="Seu nome completo"
              autoComplete="name"
              autoFocus
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

          {invite.phone ? (
            <label className="dashboard-field">
              <span>WhatsApp</span>
              <input
                type="tel"
                value={invite.phone}
                readOnly
                disabled
                style={{ opacity: 0.7, cursor: "not-allowed" }}
              />
            </label>
          ) : null}

          <button
            type="submit"
            className="dashboard-button dashboard-button--brand"
            style={{ marginTop: 4, height: 42 }}
          >
            Entrar sem senha
          </button>
        </form>

        <p style={{ marginTop: 16, fontSize: "0.78rem", color: "var(--muted)", textAlign: "center" }}>
          Voce pode definir uma senha depois em Configuracoes.
        </p>
      </div>
    </main>
  );
}

function InvalidPage() {
  return (
    <main className="auth-page-shell">
      <div className="auth-page-card">
        <BrandLogo variant="horizontal" className="auth-page-card__logo" priority />
        <h1>Link invalido</h1>
        <p className="auth-page-card__lead">
          Este link de convite e invalido ou ja foi utilizado.
        </p>
        <Link href="/login" className="dashboard-button" style={{ marginTop: 8 }}>
          Ir para o login
        </Link>
      </div>
    </main>
  );
}
