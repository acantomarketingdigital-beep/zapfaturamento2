"use client";

import { useState } from "react";
import { buildWhatsAppInviteUrl, buildWhatsAppMagicUrl } from "@/lib/invite-shared";

type Props = {
  userId: string;
  status: string | null;
  inviteUrl: string | null;
  inviteExpired: boolean;
  phone: string | null;
};

export function UserActionsCell({ userId, status, inviteUrl, inviteExpired, phone }: Props) {
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [copiedMagic, setCopiedMagic] = useState(false);
  const [magicUrl, setMagicUrl] = useState<string | null>(null);
  const [loadingMagic, setLoadingMagic] = useState(false);
  const [magicPhone, setMagicPhone] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [resendUrl, setResendUrl] = useState<string | null>(null);
  const [resendPhone, setResendPhone] = useState<string | null>(null);
  const [settingCrm, setSettingCrm] = useState(false);
  const [crmDone, setCrmDone] = useState(false);

  function copyText(text: string, cb: (v: boolean) => void) {
    navigator.clipboard.writeText(text).then(() => {
      cb(true);
      setTimeout(() => cb(false), 2000);
    });
  }

  async function handleResend() {
    setResending(true);
    try {
      const res = await fetch("/api/users/invite/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId })
      });
      const data = await res.json() as { inviteUrl?: string; phone?: string | null };
      if (data.inviteUrl) {
        setResendUrl(data.inviteUrl);
        setResendPhone(data.phone ?? null);
      }
    } finally {
      setResending(false);
    }
  }

  async function handleSetCrm() {
    setSettingCrm(true);
    try {
      await fetch(`/api/admin/users/${userId}/set-crm`, { method: "POST" });
      setCrmDone(true);
      window.location.reload();
    } finally {
      setSettingCrm(false);
    }
  }

  async function handleGenerateMagic() {
    setLoadingMagic(true);
    try {
      const res = await fetch("/api/users/magic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId })
      });
      const data = await res.json() as { magicUrl?: string; phone?: string | null; error?: string };
      if (data.magicUrl) {
        setMagicUrl(data.magicUrl);
        setMagicPhone(data.phone ?? null);
      }
    } finally {
      setLoadingMagic(false);
    }
  }

  const activeInviteUrl = resendUrl ?? inviteUrl;
  const activeInvitePhone = resendPhone ?? phone;
  const waInviteUrl = activeInviteUrl && activeInvitePhone ? buildWhatsAppInviteUrl(activeInvitePhone, activeInviteUrl) : null;
  const waMagicUrl = magicUrl && (magicPhone ?? phone) ? buildWhatsAppMagicUrl(magicPhone ?? phone ?? "", magicUrl) : null;

  if (status === "pending" && !inviteExpired) {
    return (
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
        {activeInviteUrl ? (
          <button
            type="button"
            className="dashboard-button dashboard-button--ghost dashboard-button--sm"
            onClick={() => copyText(activeInviteUrl, setCopiedInvite)}
          >
            {copiedInvite ? "Copiado!" : "Copiar link"}
          </button>
        ) : null}
        {waInviteUrl ? (
          <a
            href={waInviteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="dashboard-button dashboard-button--ghost dashboard-button--sm"
            style={{ textDecoration: "none" }}
          >
            WhatsApp
          </a>
        ) : null}
        {!resendUrl ? (
          <button
            type="button"
            className="dashboard-button dashboard-button--ghost dashboard-button--sm"
            onClick={handleResend}
            disabled={resending}
          >
            {resending ? "..." : "Gerar novo link"}
          </button>
        ) : null}
      </div>
    );
  }

  if (status === "pending" && inviteExpired) {
    return (
      <form action="/dashboard/usuarios/resend" method="post" style={{ display: "inline" }}>
        <input type="hidden" name="userId" value={userId} />
        <button type="submit" className="dashboard-button dashboard-button--ghost dashboard-button--sm">
          Gerar novo convite
        </button>
      </form>
    );
  }

  if (status === "active") {
    return (
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, alignItems: "center" }}>
        <button
          type="button"
          className="dashboard-button dashboard-button--brand dashboard-button--sm"
          onClick={handleSetCrm}
          disabled={settingCrm || crmDone}
        >
          {crmDone ? "CRM ✓" : settingCrm ? "..." : "Definir CRM"}
        </button>
        {magicUrl ? (
          <>
            <button
              type="button"
              className="dashboard-button dashboard-button--ghost dashboard-button--sm"
              onClick={() => copyText(magicUrl, setCopiedMagic)}
            >
              {copiedMagic ? "Copiado!" : "Copiar link magico"}
            </button>
            {waMagicUrl ? (
              <a
                href={waMagicUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="dashboard-button dashboard-button--ghost dashboard-button--sm"
                style={{ textDecoration: "none" }}
              >
                WhatsApp
              </a>
            ) : null}
          </>
        ) : (
          <button
            type="button"
            className="dashboard-button dashboard-button--ghost dashboard-button--sm"
            onClick={handleGenerateMagic}
            disabled={loadingMagic}
          >
            {loadingMagic ? "..." : "Gerar link magico"}
          </button>
        )}
      </div>
    );
  }

  return null;
}
