
-- 1) COUNTRIES
CREATE TABLE public.countries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  phone_prefix text,
  currency_code text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.countries TO anon, authenticated;
GRANT ALL ON public.countries TO service_role;
ALTER TABLE public.countries ENABLE ROW LEVEL SECURITY;
CREATE POLICY countries_select_all ON public.countries FOR SELECT USING (true);
CREATE POLICY countries_admin_write ON public.countries FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(),'admin'::app_role));

-- 2) PROVINCES: add country_id; relax UNIQUE(name) → UNIQUE(country_id,name)
ALTER TABLE public.provinces ADD COLUMN IF NOT EXISTS country_id uuid REFERENCES public.countries(id) ON DELETE RESTRICT;
CREATE INDEX IF NOT EXISTS idx_provinces_country ON public.provinces(country_id);

-- Seed Angola and backfill existing provinces
INSERT INTO public.countries (code,name,phone_prefix,currency_code)
VALUES ('AO','Angola','+244','AOA'), ('CV','Cabo Verde','+238','CVE')
ON CONFLICT (code) DO NOTHING;

UPDATE public.provinces SET country_id = (SELECT id FROM public.countries WHERE code='AO')
WHERE country_id IS NULL;

ALTER TABLE public.provinces ALTER COLUMN country_id SET NOT NULL;
ALTER TABLE public.provinces DROP CONSTRAINT IF EXISTS provinces_name_key;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='provinces_country_id_name_key') THEN
    ALTER TABLE public.provinces ADD CONSTRAINT provinces_country_id_name_key UNIQUE (country_id, name);
  END IF;
END $$;

-- 3) Seed Cabo Verde provinces (ilhas) + concelhos
WITH cv AS (SELECT id FROM public.countries WHERE code='CV')
INSERT INTO public.provinces (name, country_id)
SELECT n, (SELECT id FROM cv) FROM (VALUES
 ('Santo Antão'),('São Vicente'),('São Nicolau'),('Sal'),('Boa Vista'),
 ('Maio'),('Santiago'),('Fogo'),('Brava')
) AS t(n)
ON CONFLICT (country_id, name) DO NOTHING;

-- Cabo Verde concelhos (real names)
INSERT INTO public.municipalities (province_id, name, shipping_fee_aoa)
SELECT p.id, m.name, 0
FROM public.provinces p
JOIN public.countries c ON c.id = p.country_id AND c.code='CV'
JOIN (VALUES
  ('Santo Antão','Ribeira Grande'),('Santo Antão','Paul'),('Santo Antão','Porto Novo'),
  ('São Vicente','São Vicente'),
  ('São Nicolau','Ribeira Brava'),('São Nicolau','Tarrafal de São Nicolau'),
  ('Sal','Sal'),
  ('Boa Vista','Boa Vista'),
  ('Maio','Maio'),
  ('Santiago','Praia'),('Santiago','Ribeira Grande de Santiago'),('Santiago','Santa Catarina'),
  ('Santiago','Santa Cruz'),('Santiago','São Domingos'),('Santiago','São Lourenço dos Órgãos'),
  ('Santiago','São Miguel'),('Santiago','São Salvador do Mundo'),('Santiago','Tarrafal'),
  ('Fogo','Mosteiros'),('Fogo','São Filipe'),('Fogo','Santa Catarina do Fogo'),
  ('Brava','Brava')
) AS m(prov,name) ON m.prov = p.name
ON CONFLICT (province_id, name) DO NOTHING;

-- 4) DISTRICTS
CREATE TABLE public.districts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  municipality_id uuid NOT NULL REFERENCES public.municipalities(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (municipality_id, name)
);
CREATE INDEX idx_districts_municipality ON public.districts(municipality_id);
GRANT SELECT ON public.districts TO anon, authenticated;
GRANT ALL ON public.districts TO service_role;
ALTER TABLE public.districts ENABLE ROW LEVEL SECURITY;
CREATE POLICY districts_select_all ON public.districts FOR SELECT USING (true);
CREATE POLICY districts_admin_write ON public.districts FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(),'admin'::app_role));

-- Seed districts (bairros) for Luanda municipalities — real, official names
INSERT INTO public.districts (municipality_id, name)
SELECT m.id, d.name FROM public.municipalities m
JOIN public.provinces p ON p.id = m.province_id
JOIN public.countries c ON c.id = p.country_id AND c.code='AO' AND p.name='Luanda'
JOIN (VALUES
  ('Ingombota','Coqueiros'),('Ingombota','Ilha do Cabo'),('Ingombota','Maculusso'),('Ingombota','Miramar'),('Ingombota','Patrice Lumumba'),
  ('Maianga','Alvalade'),('Maianga','Cassenda'),('Maianga','Prenda'),('Maianga','Maianga'),
  ('Rangel','Nelito Soares'),('Rangel','Terra Nova'),('Rangel','Marçal'),
  ('Samba','Corimba'),('Samba','Futungo de Belas'),('Samba','Morro Bento'),
  ('Sambizanga','Bairro Operário'),('Sambizanga','Ngola Kiluanje'),('Sambizanga','Sambizanga'),
  ('Kilamba Kiaxi','Golfe'),('Kilamba Kiaxi','Palanca'),('Kilamba Kiaxi','Sapú'),
  ('Viana','Zango'),('Viana','Vila de Viana'),('Viana','Estalagem'),('Viana','Km 9'),
  ('Cazenga','Hoji-ya-Henda'),('Cazenga','Tala Hady'),('Cazenga','Cazenga')
) AS d(muni,name) ON d.muni = m.name
ON CONFLICT (municipality_id, name) DO NOTHING;

-- Praia (Cabo Verde) main freguesias
INSERT INTO public.districts (municipality_id, name)
SELECT m.id, d.name FROM public.municipalities m
JOIN public.provinces p ON p.id = m.province_id
JOIN public.countries c ON c.id = p.country_id AND c.code='CV' AND m.name='Praia'
JOIN (VALUES ('Nossa Senhora da Graça'),('São Nicolau Tolentino'),('Santíssimo Nome de Jesus')) AS d(name) ON true
ON CONFLICT (municipality_id, name) DO NOTHING;

-- 5) Add country_id / district_id to referenced tables
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS country_id uuid REFERENCES public.countries(id);
ALTER TABLE public.addresses ADD COLUMN IF NOT EXISTS country_id uuid REFERENCES public.countries(id);
ALTER TABLE public.addresses ADD COLUMN IF NOT EXISTS district_id uuid REFERENCES public.districts(id);
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS country_id uuid REFERENCES public.countries(id);
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS district_id uuid REFERENCES public.districts(id);
ALTER TABLE public.couriers ADD COLUMN IF NOT EXISTS country_id uuid REFERENCES public.countries(id);
ALTER TABLE public.couriers ADD COLUMN IF NOT EXISTS district_id uuid REFERENCES public.districts(id);
ALTER TABLE public.real_estate_agencies ADD COLUMN IF NOT EXISTS country_id uuid REFERENCES public.countries(id);
ALTER TABLE public.real_estate_agencies ADD COLUMN IF NOT EXISTS district_id uuid REFERENCES public.districts(id);
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS country_id uuid REFERENCES public.countries(id);
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS district_id uuid REFERENCES public.districts(id);

-- Default existing rows to Angola for continuity
UPDATE public.profiles     SET country_id = (SELECT id FROM public.countries WHERE code='AO') WHERE country_id IS NULL;
UPDATE public.addresses    SET country_id = (SELECT id FROM public.countries WHERE code='AO') WHERE country_id IS NULL;
UPDATE public.stores       SET country_id = (SELECT id FROM public.countries WHERE code='AO') WHERE country_id IS NULL;
UPDATE public.couriers     SET country_id = (SELECT id FROM public.countries WHERE code='AO') WHERE country_id IS NULL;
UPDATE public.real_estate_agencies SET country_id = (SELECT id FROM public.countries WHERE code='AO') WHERE country_id IS NULL;
UPDATE public.properties   SET country_id = (SELECT id FROM public.countries WHERE code='AO') WHERE country_id IS NULL;
