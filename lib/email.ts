export type EmailPayload = {
  to: string;
  subject: string;
  html: string;
};

const FROM =
  process.env.EMAIL_FROM ?? "Zap Faturamento <noreply@zapfaturamento.com.br>";

export async function sendEmail(payload: EmailPayload): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.log(
      `[EMAIL — sem RESEND_API_KEY]\nTo: ${payload.to}\nSubject: ${payload.subject}`
    );
    return false;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: FROM,
        to: payload.to,
        subject: payload.subject,
        html: payload.html
      })
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(`[EMAIL ERROR] status=${res.status} body=${body}`);
    }
    return res.ok;
  } catch (err) {
    console.error("[EMAIL ERROR]", err);
    return false;
  }
}
