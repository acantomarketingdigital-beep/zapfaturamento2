import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import { getInviteByToken } from "@/lib/invites";
import { InviteForm } from "./InviteForm";

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
        <h1>Você foi convidado</h1>
        <p className="auth-page-card__lead">
          Complete o cadastro para acessar o sistema.
        </p>

        {error ? (
          <div className="dashboard-alert dashboard-alert--error">
            {decodeURIComponent(error)}
          </div>
        ) : null}

        <InviteForm token={token} invite={invite} />

        <p style={{ marginTop: 16, fontSize: "0.78rem", color: "var(--muted)", textAlign: "center" }}>
          Já tem uma conta?{" "}
          <a href="/login" style={{ color: "var(--brand)", fontWeight: 600, textDecoration: "none" }}>
            Fazer login
          </a>
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
        <h1>Link inválido</h1>
        <p className="auth-page-card__lead">
          Este link de convite é inválido ou já foi utilizado.
        </p>
        <Link href="/login" className="dashboard-button" style={{ marginTop: 8 }}>
          Ir para o login
        </Link>
      </div>
    </main>
  );
}
