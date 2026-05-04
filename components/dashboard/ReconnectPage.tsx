"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Props = {
  token: string;
  connectionName: string;
  clientName: string;
};

type PageStatus = "loading" | "qr" | "connecting" | "connected" | "error" | "expired";

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 28, height: 28, color: "white" }}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

export function ReconnectPage({ token, connectionName, clientName }: Props) {
  const [status, setStatus] = useState<PageStatus>("loading");
  const [base64, setBase64] = useState<string | null>(null);
  const [error, setError] = useState("");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const qrRefreshRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchQR = useCallback(async () => {
    setStatus("loading");
    setError("");
    try {
      const res = await fetch(`/api/whatsapp/reconnect/${token}/qr`);
      const data = (await res.json()) as { base64?: string; error?: string };
      if (!res.ok) {
        if (res.status === 404) {
          setStatus("expired");
        } else {
          setStatus("error");
          setError(data.error ?? "Erro ao gerar QR Code.");
        }
        return;
      }
      setBase64(data.base64 ?? null);
      setStatus("qr");
    } catch {
      setStatus("error");
      setError("Erro de rede. Verifique sua conexao e tente novamente.");
    }
  }, [token]);

  const pollStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/whatsapp/reconnect/${token}/status`);
      const data = (await res.json()) as { status?: string };
      if (data.status === "connected") {
        setStatus("connected");
        if (pollRef.current) clearInterval(pollRef.current);
        if (qrRefreshRef.current) clearInterval(qrRefreshRef.current);
      } else if (data.status === "expired") {
        setStatus("expired");
        if (pollRef.current) clearInterval(pollRef.current);
        if (qrRefreshRef.current) clearInterval(qrRefreshRef.current);
      }
    } catch {
      // ignore
    }
  }, [token]);

  useEffect(() => {
    fetchQR();
  }, [fetchQR]);

  useEffect(() => {
    if (status !== "qr" && status !== "connecting") return;
    pollRef.current = setInterval(pollStatus, 3000);
    qrRefreshRef.current = setInterval(fetchQR, 30000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (qrRefreshRef.current) clearInterval(qrRefreshRef.current);
    };
  }, [status, pollStatus, fetchQR]);

  return (
    <main className="reconnect-shell">
      <div className="reconnect-card">
        <div className="reconnect-card__brand">
          <div className="reconnect-card__icon">
            <WhatsAppIcon />
          </div>
          <div>
            <div className="reconnect-card__title">ZapFaturamento</div>
            <div className="reconnect-card__subtitle">Reconexao WhatsApp</div>
          </div>
        </div>

        <div className="reconnect-card__info">
          <div><span className="reconnect-label">Cliente</span><strong>{clientName}</strong></div>
          <div><span className="reconnect-label">Conexao</span><strong>{connectionName}</strong></div>
        </div>

        {status === "loading" && (
          <div className="reconnect-card__loading">Gerando QR Code...</div>
        )}

        {status === "error" && (
          <div>
            <div className="dashboard-alert dashboard-alert--error">{error}</div>
            <button
              className="dashboard-button"
              style={{ marginTop: 12, width: "100%", height: 40 }}
              onClick={fetchQR}
            >
              Tentar novamente
            </button>
          </div>
        )}

        {status === "expired" && (
          <div className="dashboard-alert dashboard-alert--warning">
            Este link de reconexao expirou ou ja foi utilizado. Solicite um novo link ao administrador.
          </div>
        )}

        {status === "connected" && (
          <div className="reconnect-card__success">
            <div className="reconnect-card__success-icon">✓</div>
            <strong>WhatsApp reconectado com sucesso!</strong>
            <p>O atendimento pode ser retomado normalmente.</p>
          </div>
        )}

        {(status === "qr" || status === "connecting") && base64 && (
          <div className="reconnect-card__qr">
            <img src={base64} alt="QR Code WhatsApp" className="qr-image" />
            <div className="reconnect-card__steps">
              <p><strong>Como escanear:</strong></p>
              <ol>
                <li>Abra o WhatsApp Business no celular</li>
                <li>Toque em <strong>Menu</strong> → <strong>Aparelhos conectados</strong></li>
                <li>Toque em <strong>Conectar aparelho</strong></li>
                <li>Aponte a camera para o QR Code acima</li>
              </ol>
            </div>
            <p className="reconnect-card__note">
              O QR Code atualiza automaticamente a cada 30 segundos.
              Apos escanear, aguarde a confirmacao de conexao.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
