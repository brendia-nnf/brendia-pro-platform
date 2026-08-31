-- Fakturko invoice tracking on both order tables (shared DB: marketing site
-- course orders + platform webshop orders)

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS fakturko_invoice_id TEXT,
  ADD COLUMN IF NOT EXISTS fakturko_pdf_url TEXT,
  ADD COLUMN IF NOT EXISTS invoiced_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS fakturko_error TEXT;

ALTER TABLE public.webshop_orders
  ADD COLUMN IF NOT EXISTS fakturko_invoice_id TEXT,
  ADD COLUMN IF NOT EXISTS fakturko_pdf_url TEXT,
  ADD COLUMN IF NOT EXISTS invoiced_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS fakturko_error TEXT;

COMMENT ON COLUMN public.orders.fakturko_error IS 'Why auto-invoicing was skipped or failed (e.g. B2B/R1 orders pending manual eRačun)';
COMMENT ON COLUMN public.webshop_orders.fakturko_error IS 'Why auto-invoicing was skipped or failed';
