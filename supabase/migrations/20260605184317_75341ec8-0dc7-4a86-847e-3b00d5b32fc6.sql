CREATE TABLE public.exchange_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_currency text NOT NULL,
  to_currency text NOT NULL,
  rate numeric(18,8) NOT NULL CHECK (rate > 0),
  source text NOT NULL DEFAULT 'mock',
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (from_currency, to_currency)
);

GRANT SELECT ON public.exchange_rates TO anon, authenticated;
GRANT ALL ON public.exchange_rates TO service_role;

ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY exchange_rates_select_all ON public.exchange_rates
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY exchange_rates_admin_write ON public.exchange_rates
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_exchange_rates_updated_at
  BEFORE UPDATE ON public.exchange_rates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.exchange_rates (from_currency, to_currency, rate) VALUES
  ('AOA','USD',0.00110),
  ('AOA','EUR',0.00102),
  ('AOA','BRL',0.00610),
  ('AOA','ZAR',0.02050)
ON CONFLICT (from_currency, to_currency) DO NOTHING;