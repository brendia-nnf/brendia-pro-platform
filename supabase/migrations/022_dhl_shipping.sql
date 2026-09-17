-- DHL Express integracija: kolone za pošiljku na webshop narudžbama
-- + privatni storage bucket za PDF naljepnice.
-- tracking_number, shipped_at i delivered_at već postoje (007).

ALTER TABLE public.webshop_orders
  ADD COLUMN IF NOT EXISTS dhl_label_path TEXT,
  ADD COLUMN IF NOT EXISTS dhl_pickup_confirmation TEXT,
  ADD COLUMN IF NOT EXISTS dhl_error TEXT,
  ADD COLUMN IF NOT EXISTS dhl_shipment_created_at TIMESTAMPTZ;

COMMENT ON COLUMN public.webshop_orders.dhl_label_path IS 'Putanja PDF naljepnice u storage bucketu shipping-labels';
COMMENT ON COLUMN public.webshop_orders.dhl_pickup_confirmation IS 'DHL dispatch confirmation number (zakazani pickup)';
COMMENT ON COLUMN public.webshop_orders.dhl_error IS 'Zadnja DHL greška pri kreiranju pošiljke (NULL = uspjeh)';

-- Privatni bucket za naljepnice — bez RLS politika, pa mu može pristupiti
-- samo service role (admin API rute rade signed URL za download).
INSERT INTO storage.buckets (id, name, public)
VALUES ('shipping-labels', 'shipping-labels', false)
ON CONFLICT (id) DO NOTHING;
