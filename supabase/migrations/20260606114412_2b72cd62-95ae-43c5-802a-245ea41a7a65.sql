
CREATE TYPE public.courier_type AS ENUM ('motoboy','carro','van','empresa');
CREATE TYPE public.courier_status AS ENUM ('pending','active','rejected','suspended');

CREATE TABLE public.couriers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  courier_type public.courier_type NOT NULL,
  status public.courier_status NOT NULL DEFAULT 'pending',
  full_name text NOT NULL,
  company_name text,
  document_id text NOT NULL,
  driver_license text,
  phone text NOT NULL,
  email text,
  vehicle_plate text,
  vehicle_brand text,
  vehicle_model text,
  vehicle_color text,
  province_id uuid,
  municipality_id uuid,
  district text,
  street text,
  lat numeric,
  lng numeric,
  document_photo_url text,
  license_photo_url text,
  vehicle_photo_url text,
  emergency_contact_name text,
  emergency_contact_phone text,
  notes text,
  rejection_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.couriers TO authenticated;
GRANT ALL ON public.couriers TO service_role;

ALTER TABLE public.couriers ENABLE ROW LEVEL SECURITY;

CREATE POLICY couriers_select_own_or_admin ON public.couriers
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY couriers_insert_own ON public.couriers
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY couriers_update_own_or_admin ON public.couriers
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY couriers_delete_admin ON public.couriers
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER couriers_set_updated_at
  BEFORE UPDATE ON public.couriers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
