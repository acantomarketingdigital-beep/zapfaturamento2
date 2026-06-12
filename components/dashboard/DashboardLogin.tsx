"use client";

import { useState } from "react";

type DashboardLoginProps = {
  error?: string;
  configured: boolean;
};

function EyeIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
      <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
      <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
    </svg>
  );
}

function MagicLoginForm({ configured }: { configured: boolean }) {
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [waUrl, setWaUrl] = useState<string | null>(null);
  const [magicUrl, setMagicUrl] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const inputCls = "w-full rounded-lg border border-slate-700/60 bg-slate-800/60 px-4 py-2.5 pl-10 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/20 transition-all";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!emailOrPhone.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/magic-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailOrPhone: emailOrPhone.trim() }),
      });
      const data = (await res.json()) as { ok?: boolean; waUrl?: string | null; magicUrl?: string | null; error?: string };
      if (data.error) { setError(data.error); return; }
      setWaUrl(data.waUrl ?? null);
      setMagicUrl(data.magicUrl ?? null);
    } catch {
      setError("Erro de rede. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  function copyLink() {
    if (!magicUrl) return;
    navigator.clipboard.writeText(magicUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  if (waUrl || magicUrl) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-xs text-slate-500">Link gerado! Clique abaixo para abrir o WhatsApp ou copie o link.</p>
        {waUrl && (
          <a href={waUrl} target="_blank" rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold text-white bg-[#25d366] hover:bg-[#1fbe5a] transition-colors text-center no-underline">
            Abrir no WhatsApp
          </a>
        )}
        {magicUrl && (
          <button type="button" onClick={copyLink}
            className="w-full rounded-lg border border-slate-700 bg-slate-800/60 py-2.5 text-sm text-slate-300 hover:text-slate-100 hover:bg-slate-800 transition-colors">
            {copied ? "Copiado!" : "Copiar link"}
          </button>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2">
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5 text-red-400 shrink-0">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}
      <div>
        <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">
          E-mail ou WhatsApp
        </label>
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600">
            <MailIcon />
          </span>
          <input type="text" value={emailOrPhone} onChange={(e) => setEmailOrPhone(e.target.value)}
            placeholder="voce@empresa.com ou (11) 99999-9999"
            autoComplete="email" disabled={!configured} required className={inputCls} />
        </div>
      </div>
      <button type="submit" disabled={!configured || loading}
        className="w-full flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold text-slate-900 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-60 disabled:cursor-not-allowed mt-2">
        {loading ? (
          <><span className="h-4 w-4 rounded-full border-2 border-slate-900/30 border-t-slate-900 animate-spin" /> Gerando...</>
        ) : "Gerar link de acesso"}
      </button>
    </form>
  );
}

export function DashboardLogin({ error, configured }: DashboardLoginProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [magicMode, setMagicMode] = useState(false);

  const errorFromUrl = typeof window !== "undefined"
    ? new URLSearchParams(window.location.search).get("error")
    : "";
  const magicInvalid = errorFromUrl === "magic_invalid";

  const inputCls = "w-full rounded-lg border border-slate-700/60 bg-slate-800/60 px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/20 transition-all";
  const labelCls = "block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5";
  const btnPrimary = "w-full flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold text-slate-900 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-60 disabled:cursor-not-allowed mt-2";

  return (
    <div className="min-h-screen bg-[#020817] flex items-center justify-center relative overflow-hidden">
      {/* Background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-cyan-500/5 blur-[100px]" />
      <div className="absolute bottom-1/4 left-1/3 h-64 w-64 rounded-full bg-blue-600/[0.08] blur-[80px]" />
      <div className="absolute inset-0 opacity-[0.03]"
        style={{ backgroundImage: "linear-gradient(rgba(34,211,238,1) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,1) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />

      <div className="relative w-full max-w-sm px-4">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 text-slate-900">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </div>
            <span className="text-lg font-bold text-slate-100 tracking-tight">ZapFaturamento</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-px w-8 bg-slate-700" />
            <span className="text-[10px] font-medium text-slate-600 tracking-widest uppercase">Dashboard</span>
            <div className="h-px w-8 bg-slate-700" />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 backdrop-blur-sm p-8 shadow-2xl">

          {!magicMode ? (
            <>
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-slate-100">Acesse sua conta</h2>
                <p className="text-xs text-slate-500 mt-1">CRM + Tracking + WhatsApp em um painel só</p>
              </div>

              {!configured && (
                <div className="flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 mb-4">
                  <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5 text-amber-400 shrink-0">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <p className="text-xs text-amber-400">Defina <code className="font-mono">DASHBOARD_PASSWORD</code> para liberar o login.</p>
                </div>
              )}

              {(error || magicInvalid) && (
                <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 mb-4">
                  <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5 text-red-400 shrink-0">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <p className="text-xs text-red-400">
                    {magicInvalid ? "Link de acesso inválido ou expirado." : error}
                  </p>
                </div>
              )}

              <form action="/api/auth/login" method="post" className="space-y-4">
                <div>
                  <label className={labelCls}>E-mail</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600">
                      <MailIcon />
                    </span>
                    <input type="email" name="email" placeholder="voce@empresa.com"
                      autoComplete="email" disabled={!configured}
                      className={inputCls + " pl-10"} />
                  </div>
                  <p className="text-[10px] text-slate-600 mt-1">
                    Sem usuário cadastrado? Use apenas a senha administrativa.
                  </p>
                </div>

                <div>
                  <label className={labelCls}>Senha</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600">
                      <LockIcon />
                    </span>
                    <input type={showPassword ? "text" : "password"} name="password"
                      placeholder="••••••••" autoComplete="current-password"
                      disabled={!configured} required
                      className={inputCls + " pl-10 pr-10"} />
                    <button type="button" onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400 transition-colors"
                      tabIndex={-1}>
                      {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  </div>
                </div>

                <div className="flex justify-end">
                  <a href="/redefinir-senha" className="text-xs text-cyan-400/70 hover:text-cyan-400 transition-colors">
                    Esqueceu a senha?
                  </a>
                </div>

                <button type="submit" disabled={!configured} className={btnPrimary}>
                  Entrar no painel
                  <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                    <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </form>

              <div className="mt-5 pt-5 border-t border-slate-800/60 text-center">
                <button type="button" onClick={() => setMagicMode(true)}
                  className="text-xs text-slate-600 hover:text-cyan-400 transition-colors">
                  Entrar sem senha (link mágico)
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-slate-100">Entrar sem senha</h2>
                <p className="text-xs text-slate-500 mt-1">Receba um link de acesso via WhatsApp ou e-mail.</p>
              </div>

              <MagicLoginForm configured={configured} />

              <div className="mt-5 pt-5 border-t border-slate-800/60 text-center">
                <button type="button" onClick={() => setMagicMode(false)}
                  className="text-xs text-slate-600 hover:text-slate-400 transition-colors">
                  ← Voltar ao login com senha
                </button>
              </div>
            </>
          )}
        </div>

        <p className="text-center text-[10px] text-slate-700 mt-6">
          © 2025 ZapFaturamento · Todos os direitos reservados
        </p>
      </div>
    </div>
  );
}
