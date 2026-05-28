const ASAAS_BASE = "https://api.asaas.com/v3";

export type AsaasCustomer = { id: string; name: string; email: string };
export type AsaasSubscription = {
  id: string;
  customer: string;
  value: number;
  nextDueDate: string;
  cycle: string;
  status: string;
  externalReference: string | null;
};
export type AsaasPayment = {
  id: string;
  status: string;
  value: number;
  invoiceUrl: string;
  dueDate: string;
  subscription: string | null;
  externalReference: string | null;
};

function getApiKey(): string {
  const key = process.env.ASAAS_API_KEY ?? "";
  if (!key) throw new Error("ASAAS_API_KEY not configured");
  return key;
}

export function isAsaasConfigured(): boolean {
  return Boolean(process.env.ASAAS_API_KEY);
}

async function asaasFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${ASAAS_BASE}${path}`, {
    ...options,
    headers: {
      "access_token": getApiKey(),
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Asaas ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

export function createAsaasCustomer(data: {
  name: string;
  email: string;
  externalReference: string;
  cpfCnpj?: string;
}): Promise<AsaasCustomer> {
  return asaasFetch<AsaasCustomer>("/customers", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateAsaasCustomer(
  customerId: string,
  data: { cpfCnpj?: string; name?: string; email?: string }
): Promise<AsaasCustomer> {
  return asaasFetch<AsaasCustomer>(`/customers/${customerId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function createAsaasSubscription(data: {
  customer: string;
  billingType: "UNDEFINED" | "PIX" | "BOLETO" | "CREDIT_CARD";
  value: number;
  nextDueDate: string;
  cycle: "MONTHLY" | "YEARLY";
  description: string;
  externalReference: string;
}): Promise<AsaasSubscription> {
  return asaasFetch<AsaasSubscription>("/subscriptions", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function getAsaasSubscriptionPayments(
  subscriptionId: string
): Promise<{ data: AsaasPayment[] }> {
  return asaasFetch<{ data: AsaasPayment[] }>(
    `/subscriptions/${subscriptionId}/payments?limit=1`
  );
}

export function cancelAsaasSubscription(subscriptionId: string): Promise<unknown> {
  return asaasFetch(`/subscriptions/${subscriptionId}`, { method: "DELETE" });
}

export function getBaseUrl(): string {
  let url = (process.env.NEXT_PUBLIC_BASE_URL ?? "").trim().replace(/\/$/, "");
  if (!url) url = "https://zapfaturamento.com.br";
  if (!url.startsWith("http")) url = "https://" + url;
  return url;
}
