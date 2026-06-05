CREATE TABLE IF NOT EXISTS public.user_payment_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  payment_method_id uuid NOT NULL REFERENCES public.payment_methods(id) ON DELETE CASCADE,
  method_type text NOT NULL,
  label text,
  phone text,
  account_holder text,
  account_number text,
  iban text,
  bank_name text,
  card_brand text,
  card_last4 text,
  card_exp text,
  extra jsonb DEFAULT '{}'::jsonb NOT NULL,
  is_default boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_payment_accounts TO authenticated;
GRANT ALL ON public.user_payment_accounts TO service_role;
ALTER TABLE public.user_payment_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "upa select own" ON public.user_payment_accounts FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "upa insert own" ON public.user_payment_accounts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "upa update own" ON public.user_payment_accounts FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "upa delete own" ON public.user_payment_accounts FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS user_payment_accounts_user_idx ON public.user_payment_accounts(user_id);
CREATE OR REPLACE FUNCTION public.set_updated_at_upa() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;
CREATE TRIGGER set_updated_at_user_payment_accounts BEFORE UPDATE ON public.user_payment_accounts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_upa();