// MyDHL API klijent (DHL Express) — izračun cijene dostave, kreiranje
// pošiljke s naljepnicom (PDF) i pickupom te dohvat tracking statusa.
// Docs: https://developer.dhl.com/api-reference/dhl-express-mydhl-api
//
// Test okruženje (limit 500 poziva/dan, pošiljke se NE naplaćuju):
//   DHL_API_URL=https://express.api.dhl.com/mydhlapi/test
// Produkcija: https://express.api.dhl.com/mydhlapi

const DHL_TIMEOUT_MS = 15000;

// EU zemlje šaljemo bez carinske deklaracije; za ostale (BA, RS, ME, MK…)
// pošiljka se za sada kreira ručno u MyDHL sučelju jer traži izvozne dokumente.
const EU_COUNTRIES = new Set([
  "AT", "BE", "BG", "CY", "CZ", "DE", "DK", "EE", "ES", "FI", "FR", "GR",
  "HR", "HU", "IE", "IT", "LT", "LU", "LV", "MT", "NL", "PL", "PT", "RO",
  "SE", "SI", "SK",
]);

export function isEUCountry(countryCode: string): boolean {
  return EU_COUNTRIES.has(countryCode.toUpperCase());
}

export interface DHLAddress {
  fullName: string;
  street: string;
  city: string;
  postalCode: string;
  countryCode: string; // ISO 3166-1 alpha-2
  phone?: string | null;
  email?: string | null;
}

export interface DHLShipmentParams {
  receiver: DHLAddress;
  weightKg: number;
  orderNumber: string;
  description: string;
  // YYYY-MM-DD; mora biti radni dan, danas ili u budućnosti
  shippingDate: string;
  requestPickup: boolean;
}

export interface DHLShipmentResult {
  ok: boolean;
  trackingNumber?: string;
  labelPdfBase64?: string;
  pickupConfirmation?: string;
  error?: string;
}

export interface DHLRateResult {
  ok: boolean;
  price?: number; // EUR, s PDV-om kako ga DHL vraća za billing valutu
  productCode?: string;
  error?: string;
}

export interface DHLTrackingResult {
  ok: boolean;
  delivered?: boolean;
  lastEvent?: string;
  error?: string;
}

function config() {
  return {
    baseUrl: process.env.DHL_API_URL || "https://express.api.dhl.com/mydhlapi/test",
    apiKey: process.env.DHL_API_KEY,
    apiSecret: process.env.DHL_API_SECRET,
    accountNumber: process.env.DHL_ACCOUNT_NUMBER,
    productDomestic: process.env.DHL_PRODUCT_DOMESTIC || "N", // DOMESTIC EXPRESS
    productEU: process.env.DHL_PRODUCT_EU || "W", // ECONOMY SELECT (cestovni, jeftiniji od U)
    shipper: {
      fullName: process.env.DHL_SHIPPER_NAME || "Brendia Pro",
      company: process.env.DHL_SHIPPER_COMPANY || "Brendia Pro",
      street: process.env.DHL_SHIPPER_STREET,
      city: process.env.DHL_SHIPPER_CITY,
      postalCode: process.env.DHL_SHIPPER_POSTAL_CODE,
      countryCode: process.env.DHL_SHIPPER_COUNTRY || "HR",
      phone: process.env.DHL_SHIPPER_PHONE,
      email: process.env.DHL_SHIPPER_EMAIL || "info@brendiapro.hr",
    },
  };
}

export function isDHLConfigured(): boolean {
  const { apiKey, apiSecret, accountNumber, shipper } = config();
  return !!apiKey && !!apiSecret && !!accountNumber && !!shipper.street && !!shipper.city && !!shipper.postalCode;
}

function authHeader(): string {
  const { apiKey, apiSecret } = config();
  return `Basic ${Buffer.from(`${apiKey}:${apiSecret}`).toString("base64")}`;
}

async function dhlFetch(
  path: string,
  init?: { method?: string; body?: Record<string, unknown> }
): Promise<{ status: number; json: Record<string, unknown> }> {
  const { baseUrl } = config();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DHL_TIMEOUT_MS);
  try {
    const res = await fetch(`${baseUrl}${path}`, {
      method: init?.method || "GET",
      headers: {
        Authorization: authHeader(),
        "Content-Type": "application/json",
      },
      ...(init?.body ? { body: JSON.stringify(init.body) } : {}),
      signal: controller.signal,
    });
    const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    return { status: res.status, json };
  } finally {
    clearTimeout(timeout);
  }
}

function productCodeFor(countryCode: string): string {
  const { productDomestic, productEU, shipper } = config();
  return countryCode.toUpperCase() === shipper.countryCode.toUpperCase()
    ? productDomestic
    : productEU;
}

// DHL ne preuzima pošiljke vikendom — pomakni na prvi radni dan
export function nextBusinessDay(from = new Date()): string {
  const d = new Date(from);
  while (d.getDay() === 0 || d.getDay() === 6) {
    d.setDate(d.getDate() + 1);
  }
  return d.toISOString().slice(0, 10);
}

// "2026-09-17T10:00:00 GMT+02:00" — offset za Europe/Zagreb na taj datum
function plannedShippingDateAndTime(dateISO: string): string {
  const offset = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Zagreb",
    timeZoneName: "longOffset",
  })
    .formatToParts(new Date(`${dateISO}T10:00:00Z`))
    .find((p) => p.type === "timeZoneName")?.value.replace("GMT", "");
  return `${dateISO}T10:00:00 GMT${offset || "+01:00"}`;
}

function firstDHLError(json: Record<string, unknown>): string {
  const detail = (json.detail as string) || (json.message as string);
  const additional = Array.isArray(json.additionalDetails)
    ? ` — ${(json.additionalDetails as string[]).join("; ")}`
    : "";
  return detail ? `${detail}${additional}` : JSON.stringify(json).slice(0, 300);
}

/**
 * Cijena dostave za jedan paket (account rate iz Nikolininog ugovora).
 * Vraća cijenu konfiguriranog produkta, ili najjeftiniju ponuđenu ako
 * konfigurirani produkt nije dostupan za destinaciju.
 */
export async function getDHLRate(params: {
  destination: Pick<DHLAddress, "city" | "postalCode" | "countryCode">;
  weightKg: number;
}): Promise<DHLRateResult> {
  try {
    if (!isDHLConfigured()) {
      return { ok: false, error: "DHL nije konfiguriran (env)" };
    }
    const { accountNumber, shipper } = config();
    const wanted = productCodeFor(params.destination.countryCode);

    const query = new URLSearchParams({
      accountNumber: accountNumber!,
      originCountryCode: shipper.countryCode,
      originCityName: shipper.city!,
      originPostalCode: shipper.postalCode!,
      destinationCountryCode: params.destination.countryCode.toUpperCase(),
      destinationCityName: params.destination.city,
      destinationPostalCode: params.destination.postalCode,
      weight: String(Math.max(params.weightKg, 0.5)),
      length: "30",
      width: "25",
      height: "10",
      plannedShippingDate: nextBusinessDay(),
      isCustomsDeclarable: "false",
      unitOfMeasurement: "metric",
    });

    const { status, json } = await dhlFetch(`/rates?${query.toString()}`);
    if (status !== 200) {
      return { ok: false, error: firstDHLError(json) };
    }

    const products = (json.products as Array<{
      productCode?: string;
      totalPrice?: Array<{ currencyType?: string; priceCurrency?: string; price?: number }>;
    }>) || [];

    const priceOf = (p: (typeof products)[number]): number | null => {
      const entry =
        p.totalPrice?.find((t) => t.currencyType === "BILLC" && (t.price || 0) > 0) ||
        p.totalPrice?.find((t) => (t.price || 0) > 0);
      return entry?.price ?? null;
    };

    const match = products.find((p) => p.productCode === wanted && priceOf(p) !== null);
    const cheapest = products
      .filter((p) => priceOf(p) !== null)
      .sort((a, b) => priceOf(a)! - priceOf(b)!)[0];
    const chosen = match || cheapest;

    if (!chosen) {
      return { ok: false, error: "DHL nije vratio nijednu cijenu za destinaciju" };
    }
    return { ok: true, price: priceOf(chosen)!, productCode: chosen.productCode };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "DHL rate request failed",
    };
  }
}

/**
 * Kreira DHL Express pošiljku (bez carinske deklaracije — samo EU) i vraća
 * tracking broj + naljepnicu kao base64 PDF. Uz requestPickup kurir dolazi
 * na adresu pošiljatelja na dan shippingDate.
 */
export async function createDHLShipment(
  params: DHLShipmentParams
): Promise<DHLShipmentResult> {
  try {
    if (!isDHLConfigured()) {
      return { ok: false, error: "DHL nije konfiguriran (env)" };
    }
    if (!isEUCountry(params.receiver.countryCode)) {
      return {
        ok: false,
        error: `Destinacija ${params.receiver.countryCode} nije u EU — pošiljka traži carinsku dokumentaciju, kreiraj je ručno u MyDHL sučelju`,
      };
    }

    const { accountNumber, shipper } = config();

    const body: Record<string, unknown> = {
      plannedShippingDateAndTime: plannedShippingDateAndTime(params.shippingDate),
      pickup: params.requestPickup
        ? { isRequested: true, closeTime: "18:00" }
        : { isRequested: false },
      productCode: productCodeFor(params.receiver.countryCode),
      accounts: [{ typeCode: "shipper", number: accountNumber }],
      customerReferences: [{ value: params.orderNumber, typeCode: "CU" }],
      customerDetails: {
        shipperDetails: {
          postalAddress: {
            postalCode: shipper.postalCode,
            cityName: shipper.city,
            countryCode: shipper.countryCode,
            addressLine1: shipper.street,
          },
          contactInformation: {
            email: shipper.email,
            phone: shipper.phone || "",
            companyName: shipper.company,
            fullName: shipper.fullName,
          },
        },
        receiverDetails: {
          postalAddress: {
            postalCode: params.receiver.postalCode,
            cityName: params.receiver.city,
            countryCode: params.receiver.countryCode.toUpperCase(),
            addressLine1: params.receiver.street.slice(0, 45),
          },
          contactInformation: {
            ...(params.receiver.email ? { email: params.receiver.email } : {}),
            phone: params.receiver.phone || "",
            // Privatni primatelj: DHL traži companyName — koristi se ime
            companyName: params.receiver.fullName,
            fullName: params.receiver.fullName,
          },
        },
      },
      content: {
        packages: [
          {
            weight: Math.max(params.weightKg, 0.5),
            dimensions: { length: 30, width: 25, height: 10 },
          },
        ],
        isCustomsDeclarable: false,
        description: params.description.slice(0, 70),
        unitOfMeasurement: "metric",
      },
      outputImageProperties: {
        encodingFormat: "pdf",
        imageOptions: [{ typeCode: "label" }],
      },
    };

    const { status, json } = await dhlFetch("/shipments", { method: "POST", body });
    if (status !== 201) {
      return { ok: false, error: firstDHLError(json) };
    }

    const documents = (json.documents as Array<{
      typeCode?: string;
      imageFormat?: string;
      content?: string;
    }>) || [];
    const label = documents.find((d) => d.typeCode === "label") || documents[0];
    const dispatch = Array.isArray(json.dispatchConfirmationNumbers)
      ? (json.dispatchConfirmationNumbers as string[])[0]
      : undefined;

    return {
      ok: true,
      trackingNumber: json.shipmentTrackingNumber
        ? String(json.shipmentTrackingNumber)
        : undefined,
      labelPdfBase64: label?.content,
      pickupConfirmation: dispatch,
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "DHL shipment request failed",
    };
  }
}

/** Tracking status pošiljke — typeCode "OK" znači isporučeno. */
export async function getDHLTracking(
  trackingNumber: string
): Promise<DHLTrackingResult> {
  try {
    if (!isDHLConfigured()) {
      return { ok: false, error: "DHL nije konfiguriran (env)" };
    }
    const { status, json } = await dhlFetch(
      `/shipments/${encodeURIComponent(trackingNumber)}/tracking?trackingView=all-checkpoints`
    );
    if (status !== 200) {
      return { ok: false, error: firstDHLError(json) };
    }

    const shipment = (json.shipments as Array<{
      events?: Array<{ typeCode?: string; description?: string; date?: string }>;
    }>)?.[0];
    const events = shipment?.events || [];
    const delivered = events.some((e) => e.typeCode === "OK");
    const last = events[events.length - 1];

    return {
      ok: true,
      delivered,
      lastEvent: last ? `${last.date || ""} ${last.description || ""}`.trim() : undefined,
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "DHL tracking request failed",
    };
  }
}

export function dhlTrackingUrl(trackingNumber: string): string {
  return `https://www.dhl.com/hr-hr/home/tracking/tracking-express.html?submit=1&tracking-id=${encodeURIComponent(trackingNumber)}`;
}
