// Fakturko API client — automatsko izdavanje fiskaliziranih računa
// nakon uspješne Monri naplate. Docs: https://api.fakturko.hr/docs
//
// Test okruženje (testni fiskalni certifikat, računi se NE fiskaliziraju
// stvarno): FAKTURKO_API_URL=https://testapi.fakturko.hr
// Produkcija (nakon Fakturko migracije): https://api.fakturko.hr

const FAKTURKO_TIMEOUT_MS = 15000;

export interface FakturkoClient {
  type: "privatna" | "pravna";
  name: string;
  surname?: string;
  oib?: string;
  country: string;
  city?: string;
  address?: string;
  zip?: string;
  email?: string;
  phone?: string;
}

export interface FakturkoLine {
  name: string;
  description?: string;
  kpdCode: string;
  quantity: number;
  unitPriceWithoutVat: number;
  priceWithoutVat: number;
  vatPercentage: number;
  priceWithVat: number;
}

export interface FakturkoInvoiceParams {
  client: FakturkoClient;
  lines: FakturkoLine[];
  totalWithoutVat: number;
  totalWithVat: number;
  // Fixed discount amount (gross) applied to the whole invoice, if any
  fixedRabat?: number;
  extRef: string;
  note?: string;
  datePaid?: string; // YYYY-MM-DD
}

export interface FakturkoResult {
  ok: boolean;
  invoiceId?: string;
  pdfLink?: string;
  error?: string;
}

function config() {
  return {
    baseUrl: process.env.FAKTURKO_API_URL || "https://testapi.fakturko.hr",
    username: process.env.FAKTURKO_API_USERNAME,
    password: process.env.FAKTURKO_API_PASSWORD,
    poslJedinicaId: process.env.FAKTURKO_POSL_JEDINICA_ID,
    naplUredajId: process.env.FAKTURKO_NAPL_UREDAJ_ID,
  };
}

export function isFakturkoConfigured(): boolean {
  const { username, password } = config();
  return !!username && !!password;
}

async function fakturkoPost(
  path: string,
  body: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const { baseUrl } = config();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FAKTURKO_TIMEOUT_MS);
  try {
    const res = await fetch(`${baseUrl}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    return (await res.json()) as Record<string, unknown>;
  } finally {
    clearTimeout(timeout);
  }
}

async function getAuthToken(): Promise<string | null> {
  const { username, password } = config();
  if (!username || !password) return null;
  const result = await fakturkoPost("/api/get_auth_token", {
    auth: { username, password },
  });
  return (result.token as string) || null;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export async function createFakturkoInvoice(
  params: FakturkoInvoiceParams
): Promise<FakturkoResult> {
  try {
    if (!isFakturkoConfigured()) {
      return { ok: false, error: "Fakturko nije konfiguriran (env)" };
    }

    const token = await getAuthToken();
    if (!token) {
      return { ok: false, error: "Fakturko autentifikacija nije uspjela" };
    }

    const today = new Date().toISOString().slice(0, 10);
    const { poslJedinicaId, naplUredajId } = config();

    const invoice: Record<string, unknown> = {
      payment_type: "K", // kartica (Monri)
      total_without_vat: round2(params.totalWithoutVat),
      total_with_vat: round2(params.totalWithVat),
      is_rabat: 0,
      is_paid: 1,
      paid_without_vat: round2(params.totalWithoutVat),
      paid_with_vat: round2(params.totalWithVat),
      date_paid: params.datePaid || today,
      is_hourly_billable: 1,
      due_date: params.datePaid || today,
      delivery_date: params.datePaid || today,
      ext_ref: params.extRef,
      ...(params.note ? { note: params.note } : {}),
      ...(params.fixedRabat && params.fixedRabat > 0
        ? { is_fixed_rabat: 1, fixed_rabat: round2(params.fixedRabat) }
        : {}),
      ...(poslJedinicaId ? { posl_jedinice_id: Number(poslJedinicaId) } : {}),
      ...(naplUredajId ? { napl_uredaj_id: Number(naplUredajId) } : {}),
    };

    const client: Record<string, unknown> = {
      client_type: params.client.type,
      client_name: params.client.name,
      client_country: params.client.country,
      ...(params.client.surname ? { client_surname: params.client.surname } : {}),
      ...(params.client.oib ? { client_oib: params.client.oib } : {}),
      ...(params.client.city ? { client_city: params.client.city } : {}),
      ...(params.client.address ? { client_address: params.client.address } : {}),
      ...(params.client.zip ? { client_zip: params.client.zip } : {}),
      ...(params.client.email ? { client_email: params.client.email } : {}),
      ...(params.client.phone ? { client_phone: params.client.phone } : {}),
    };

    const invoice_services = params.lines.map((line) => ({
      name: line.name,
      ...(line.description ? { description: line.description } : {}),
      kpd_code: line.kpdCode,
      hours: line.quantity,
      quantity_text: "kom",
      price_without_vat_per_hour: round2(line.unitPriceWithoutVat),
      price_without_vat: round2(line.priceWithoutVat),
      vat_percentage: line.vatPercentage,
      price_with_vat: round2(line.priceWithVat),
    }));

    const result = await fakturkoPost("/api/insert_invoice", {
      auth_token: { token },
      client,
      invoice,
      invoice_services,
    });

    if (result.status === 1 || result.status === true) {
      return {
        ok: true,
        invoiceId: result.invoice_id ? String(result.invoice_id) : undefined,
        pdfLink: (result.pdf_link as string) || undefined,
      };
    }

    return {
      ok: false,
      error: (result.message as string) || "Nepoznata Fakturko greška",
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Fakturko request failed",
    };
  }
}
