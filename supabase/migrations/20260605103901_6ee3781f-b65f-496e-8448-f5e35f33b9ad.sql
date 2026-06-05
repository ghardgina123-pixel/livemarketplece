-- Add country_code to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS country_code TEXT NOT NULL DEFAULT 'AO';

-- Create payment_methods table
CREATE TABLE public.payment_methods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  country_code TEXT NOT NULL,
  currency_code TEXT NOT NULL,
  currency_symbol TEXT NOT NULL,
  method_type TEXT NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  requires_proof_upload BOOLEAN NOT NULL DEFAULT false,
  is_cash_on_delivery BOOLEAN NOT NULL DEFAULT false,
  sort_order INT NOT NULL DEFAULT 0,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.payment_methods TO anon, authenticated;
GRANT ALL ON public.payment_methods TO service_role;

ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payment_methods_select_active" ON public.payment_methods
  FOR SELECT TO anon, authenticated USING (is_active = true);

CREATE POLICY "payment_methods_admin_write" ON public.payment_methods
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER payment_methods_set_updated_at
  BEFORE UPDATE ON public.payment_methods
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_payment_methods_country_active ON public.payment_methods (country_code, is_active, sort_order);

-- Seed Angola payment methods
INSERT INTO public.payment_methods (country_code, currency_code, currency_symbol, method_type, display_name, description, icon, requires_proof_upload, is_cash_on_delivery, sort_order, config) VALUES
('AO', 'AOA', 'Kz', 'multicaixa_express', 'Multicaixa Express', 'Pagamento instantâneo pelo telemóvel', 'smartphone', false, false, 1, '{"phone_prefix":"+244"}'::jsonb),
('AO', 'AOA', 'Kz', 'multicaixa_reference', 'Referência Multicaixa', 'Pague em qualquer ATM ou homebanking', 'credit-card', false, false, 2, '{"entity":"00123"}'::jsonb),
('AO', 'AOA', 'Kz', 'bank_transfer', 'Transferência Bancária', 'BAI · BFA · BIC · Atlântico (envie comprovativo)', 'banknote', true, false, 3, '{"iban":"AO06.0040.0000.1234.5678.9012.3","bank":"BAI","holder":"Live Market Lda"}'::jsonb),
('AO', 'AOA', 'Kz', 'cash_on_delivery', 'Dinheiro / TPA na entrega', 'Pague ao receber em mão', 'banknote', false, true, 4, '{}'::jsonb);

-- Seed EUR example
INSERT INTO public.payment_methods (country_code, currency_code, currency_symbol, method_type, display_name, description, icon, requires_proof_upload, is_cash_on_delivery, sort_order, config) VALUES
('PT', 'EUR', '€', 'stripe_card', 'Cartão de crédito / débito', 'Visa · Mastercard · processado por Stripe', 'credit-card', false, false, 1, '{"provider":"stripe","supported_brands":["visa","mastercard","amex"]}'::jsonb);