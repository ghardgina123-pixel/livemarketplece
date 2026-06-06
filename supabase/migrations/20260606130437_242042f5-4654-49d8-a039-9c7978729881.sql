
-- Enums
CREATE TYPE public.agency_status AS ENUM ('pending', 'active', 'rejected', 'suspended');
CREATE TYPE public.property_type AS ENUM ('casa', 'apartamento', 'terreno', 'comercial', 'escritorio');
CREATE TYPE public.listing_type AS ENUM ('venda', 'arrendamento');
CREATE TYPE public.property_status AS ENUM ('pending', 'approved', 'rejected', 'sold', 'rented');
CREATE TYPE public.visit_request_status AS ENUM ('pending', 'confirmed', 'rejected', 'done');
CREATE TYPE public.agency_live_fee_status AS ENUM ('pending', 'paid', 'approved', 'rejected');

-- Agencies
CREATE TABLE public.real_estate_agencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL,
  name TEXT NOT NULL,
  nif TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  description TEXT,
  logo_url TEXT,
  cover_url TEXT,
  province_id UUID REFERENCES public.provinces(id),
  municipality_id UUID REFERENCES public.municipalities(id),
  district TEXT,
  street TEXT,
  lat NUMERIC,
  lng NUMERIC,
  status public.agency_status NOT NULL DEFAULT 'pending',
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.real_estate_agencies TO authenticated;
GRANT SELECT ON public.real_estate_agencies TO anon;
GRANT ALL ON public.real_estate_agencies TO service_role;
ALTER TABLE public.real_estate_agencies ENABLE ROW LEVEL SECURITY;
CREATE POLICY agencies_select_public ON public.real_estate_agencies FOR SELECT
  USING (status = 'active' OR owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY agencies_insert_own ON public.real_estate_agencies FOR INSERT
  TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY agencies_update_own_or_admin ON public.real_estate_agencies FOR UPDATE
  TO authenticated USING (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_agencies_updated BEFORE UPDATE ON public.real_estate_agencies
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Properties
CREATE TABLE public.properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.real_estate_agencies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  property_type public.property_type NOT NULL,
  listing_type public.listing_type NOT NULL,
  price_aoa NUMERIC NOT NULL DEFAULT 0,
  rent_period TEXT,
  bedrooms INT,
  bathrooms INT,
  area_m2 NUMERIC,
  parking_spots INT,
  furnished BOOLEAN NOT NULL DEFAULT false,
  province_id UUID REFERENCES public.provinces(id),
  municipality_id UUID REFERENCES public.municipalities(id),
  district TEXT,
  street TEXT,
  lat NUMERIC,
  lng NUMERIC,
  cover_url TEXT,
  status public.property_status NOT NULL DEFAULT 'pending',
  rejection_reason TEXT,
  featured BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.properties TO authenticated;
GRANT SELECT ON public.properties TO anon;
GRANT ALL ON public.properties TO service_role;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
CREATE POLICY properties_select_public ON public.properties FOR SELECT
  USING (
    status IN ('approved','sold','rented')
    OR public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.real_estate_agencies a WHERE a.id = properties.agency_id AND a.owner_id = auth.uid())
  );
CREATE POLICY properties_insert_owner ON public.properties FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.real_estate_agencies a WHERE a.id = agency_id AND a.owner_id = auth.uid()));
CREATE POLICY properties_update_owner_or_admin ON public.properties FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR EXISTS (SELECT 1 FROM public.real_estate_agencies a WHERE a.id = agency_id AND a.owner_id = auth.uid()))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR EXISTS (SELECT 1 FROM public.real_estate_agencies a WHERE a.id = agency_id AND a.owner_id = auth.uid()));
CREATE POLICY properties_delete_owner ON public.properties FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.real_estate_agencies a WHERE a.id = agency_id AND a.owner_id = auth.uid()));
CREATE TRIGGER trg_properties_updated BEFORE UPDATE ON public.properties
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Property images
CREATE TABLE public.property_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.property_images TO authenticated;
GRANT SELECT ON public.property_images TO anon;
GRANT ALL ON public.property_images TO service_role;
ALTER TABLE public.property_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY property_images_select ON public.property_images FOR SELECT USING (true);
CREATE POLICY property_images_write_owner ON public.property_images FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.properties p JOIN public.real_estate_agencies a ON a.id = p.agency_id
                 WHERE p.id = property_images.property_id AND a.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.properties p JOIN public.real_estate_agencies a ON a.id = p.agency_id
                 WHERE p.id = property_images.property_id AND a.owner_id = auth.uid()));

-- Visit requests
CREATE TABLE public.property_visit_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL,
  preferred_date DATE NOT NULL,
  preferred_time TEXT,
  contact_phone TEXT NOT NULL,
  message TEXT,
  status public.visit_request_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.property_visit_requests TO authenticated;
GRANT ALL ON public.property_visit_requests TO service_role;
ALTER TABLE public.property_visit_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY visits_insert_customer ON public.property_visit_requests FOR INSERT TO authenticated
  WITH CHECK (customer_id = auth.uid());
CREATE POLICY visits_select_participant ON public.property_visit_requests FOR SELECT TO authenticated
  USING (
    customer_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.properties p JOIN public.real_estate_agencies a ON a.id = p.agency_id
               WHERE p.id = property_visit_requests.property_id AND a.owner_id = auth.uid())
  );
CREATE POLICY visits_update_agency_or_admin ON public.property_visit_requests FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.properties p JOIN public.real_estate_agencies a ON a.id = p.agency_id
               WHERE p.id = property_visit_requests.property_id AND a.owner_id = auth.uid())
  );
CREATE TRIGGER trg_visits_updated BEFORE UPDATE ON public.property_visit_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Agency live fees
CREATE TABLE public.agency_live_fees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.real_estate_agencies(id) ON DELETE CASCADE,
  live_id UUID,
  property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  amount_aoa NUMERIC NOT NULL DEFAULT 5000,
  status public.agency_live_fee_status NOT NULL DEFAULT 'pending',
  payment_method TEXT,
  proof_url TEXT,
  rejection_reason TEXT,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agency_live_fees TO authenticated;
GRANT ALL ON public.agency_live_fees TO service_role;
ALTER TABLE public.agency_live_fees ENABLE ROW LEVEL SECURITY;
CREATE POLICY agency_live_fees_select ON public.agency_live_fees FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin')
         OR EXISTS (SELECT 1 FROM public.real_estate_agencies a WHERE a.id = agency_id AND a.owner_id = auth.uid()));
CREATE POLICY agency_live_fees_insert_owner ON public.agency_live_fees FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.real_estate_agencies a WHERE a.id = agency_id AND a.owner_id = auth.uid()));
CREATE POLICY agency_live_fees_update_owner_pending ON public.agency_live_fees FOR UPDATE TO authenticated
  USING (status = 'pending' AND EXISTS (SELECT 1 FROM public.real_estate_agencies a WHERE a.id = agency_id AND a.owner_id = auth.uid()))
  WITH CHECK (status IN ('pending','paid') AND EXISTS (SELECT 1 FROM public.real_estate_agencies a WHERE a.id = agency_id AND a.owner_id = auth.uid()));
CREATE POLICY agency_live_fees_update_admin ON public.agency_live_fees FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_agency_live_fees_updated BEFORE UPDATE ON public.agency_live_fees
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Admin RPCs
CREATE OR REPLACE FUNCTION public.admin_approve_agency(_agency_id UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'not_authorized'; END IF;
  UPDATE public.real_estate_agencies SET status='active', rejection_reason=NULL, updated_at=now() WHERE id=_agency_id;
END; $$;

CREATE OR REPLACE FUNCTION public.admin_reject_agency(_agency_id UUID, _reason TEXT)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'not_authorized'; END IF;
  UPDATE public.real_estate_agencies SET status='rejected', rejection_reason=COALESCE(_reason,'Sem motivo'), updated_at=now() WHERE id=_agency_id;
END; $$;

CREATE OR REPLACE FUNCTION public.admin_approve_property(_property_id UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'not_authorized'; END IF;
  UPDATE public.properties SET status='approved', rejection_reason=NULL, updated_at=now() WHERE id=_property_id;
END; $$;

CREATE OR REPLACE FUNCTION public.admin_reject_property(_property_id UUID, _reason TEXT)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'not_authorized'; END IF;
  UPDATE public.properties SET status='rejected', rejection_reason=COALESCE(_reason,'Sem motivo'), updated_at=now() WHERE id=_property_id;
END; $$;

CREATE OR REPLACE FUNCTION public.admin_approve_agency_live_fee(_fee_id UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'not_authorized'; END IF;
  UPDATE public.agency_live_fees SET status='approved', approved_at=now(), rejection_reason=NULL, updated_at=now() WHERE id=_fee_id;
END; $$;

CREATE OR REPLACE FUNCTION public.admin_reject_agency_live_fee(_fee_id UUID, _reason TEXT)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'not_authorized'; END IF;
  UPDATE public.agency_live_fees SET status='rejected', rejection_reason=COALESCE(_reason,'Sem motivo'), updated_at=now() WHERE id=_fee_id;
END; $$;

-- Indexes
CREATE INDEX idx_properties_agency ON public.properties(agency_id);
CREATE INDEX idx_properties_status ON public.properties(status);
CREATE INDEX idx_property_images_property ON public.property_images(property_id);
CREATE INDEX idx_visits_property ON public.property_visit_requests(property_id);
CREATE INDEX idx_agency_fees_agency ON public.agency_live_fees(agency_id);
