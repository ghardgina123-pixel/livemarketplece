
-- =========================================================
-- FASE 1: Logística Angola + Carrinho/Checkout em AOA
-- =========================================================

-- 1) Geografia: provincias e municipios (distrito fica como texto livre)
CREATE TABLE public.provinces (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.provinces TO anon, authenticated;
GRANT ALL ON public.provinces TO service_role;
ALTER TABLE public.provinces ENABLE ROW LEVEL SECURITY;
CREATE POLICY "provinces_select_all" ON public.provinces FOR SELECT USING (true);

CREATE TABLE public.municipalities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  province_id UUID NOT NULL REFERENCES public.provinces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  shipping_fee_aoa NUMERIC(12,2) NOT NULL DEFAULT 2000,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (province_id, name)
);
CREATE INDEX idx_municipalities_province ON public.municipalities(province_id);
GRANT SELECT ON public.municipalities TO anon, authenticated;
GRANT ALL ON public.municipalities TO service_role;
ALTER TABLE public.municipalities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "municipalities_select_all" ON public.municipalities FOR SELECT USING (true);
CREATE POLICY "municipalities_admin_write" ON public.municipalities FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 2) Enderecos dos clientes
CREATE TABLE public.addresses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  label TEXT NOT NULL DEFAULT 'Casa',
  province_id UUID NOT NULL REFERENCES public.provinces(id),
  municipality_id UUID NOT NULL REFERENCES public.municipalities(id),
  district TEXT,
  street TEXT NOT NULL,
  reference TEXT,
  recipient_name TEXT,
  phone TEXT,
  lat NUMERIC(10,7),
  lng NUMERIC(10,7),
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_addresses_user ON public.addresses(user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.addresses TO authenticated;
GRANT ALL ON public.addresses TO service_role;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "addresses_owner_all" ON public.addresses FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE TRIGGER trg_addresses_updated_at BEFORE UPDATE ON public.addresses
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3) Precos em AOA + localizacao para lojas e produtos
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS price_aoa NUMERIC(12,2);
UPDATE public.products SET price_aoa = COALESCE(price_aoa, ROUND(price_brl * 175, 2));
ALTER TABLE public.products ALTER COLUMN price_aoa SET NOT NULL;
ALTER TABLE public.products ALTER COLUMN price_aoa SET DEFAULT 0;

ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS province_id UUID REFERENCES public.provinces(id),
  ADD COLUMN IF NOT EXISTS municipality_id UUID REFERENCES public.municipalities(id),
  ADD COLUMN IF NOT EXISTS lat NUMERIC(10,7),
  ADD COLUMN IF NOT EXISTS lng NUMERIC(10,7);

-- 4) Pedidos em AOA com endereco de entrega
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS address_id UUID REFERENCES public.addresses(id),
  ADD COLUMN IF NOT EXISTS shipping_aoa NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS subtotal_aoa NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_aoa NUMERIC(12,2) NOT NULL DEFAULT 0;

ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS unit_price_aoa NUMERIC(12,2) NOT NULL DEFAULT 0;

-- 5) Funcao para criar pedido com validacao de stock (transacional)
CREATE OR REPLACE FUNCTION public.create_order_with_items(
  p_store_id UUID,
  p_address_id UUID,
  p_items JSONB,
  p_payment_method TEXT DEFAULT 'manual'
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_id UUID;
  v_customer UUID := auth.uid();
  v_item JSONB;
  v_product RECORD;
  v_qty INT;
  v_subtotal NUMERIC(12,2) := 0;
  v_shipping NUMERIC(12,2) := 0;
  v_municipality UUID;
BEGIN
  IF v_customer IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;

  -- Verificar e travar produtos
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_qty := (v_item->>'quantity')::INT;
    IF v_qty <= 0 THEN RAISE EXCEPTION 'invalid_quantity'; END IF;

    SELECT id, stock, price_aoa, store_id, status
      INTO v_product
      FROM products
     WHERE id = (v_item->>'product_id')::UUID
     FOR UPDATE;

    IF NOT FOUND THEN RAISE EXCEPTION 'product_not_found:%', v_item->>'product_id'; END IF;
    IF v_product.status <> 'approved' THEN RAISE EXCEPTION 'product_not_available:%', v_product.id; END IF;
    IF v_product.store_id <> p_store_id THEN RAISE EXCEPTION 'mixed_stores'; END IF;
    IF v_product.stock < v_qty THEN RAISE EXCEPTION 'out_of_stock:%', v_product.id; END IF;

    v_subtotal := v_subtotal + (v_product.price_aoa * v_qty);
  END LOOP;

  -- Calcular frete pelo municipio do endereco
  SELECT a.municipality_id INTO v_municipality
    FROM addresses a WHERE a.id = p_address_id AND a.user_id = v_customer;
  IF v_municipality IS NULL THEN RAISE EXCEPTION 'invalid_address'; END IF;

  SELECT shipping_fee_aoa INTO v_shipping FROM municipalities WHERE id = v_municipality;

  -- Criar pedido
  INSERT INTO orders (store_id, customer_id, total_brl, subtotal_aoa, shipping_aoa, total_aoa, address_id, payment_method, status)
  VALUES (p_store_id, v_customer, 0, v_subtotal, v_shipping, v_subtotal + v_shipping, p_address_id, p_payment_method, 'pending')
  RETURNING id INTO v_order_id;

  -- Criar items e decrementar stock
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_qty := (v_item->>'quantity')::INT;
    SELECT price_aoa INTO v_product FROM products WHERE id = (v_item->>'product_id')::UUID;

    INSERT INTO order_items (order_id, product_id, quantity, unit_price_brl, unit_price_aoa)
    VALUES (v_order_id, (v_item->>'product_id')::UUID, v_qty, 0, v_product.price_aoa);

    UPDATE products SET stock = stock - v_qty WHERE id = (v_item->>'product_id')::UUID;
  END LOOP;

  RETURN v_order_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_order_with_items(UUID, UUID, JSONB, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_order_with_items(UUID, UUID, JSONB, TEXT) TO authenticated;

-- 6) Seed de provincias e municipios principais
INSERT INTO public.provinces (name) VALUES
  ('Luanda'),('Benguela'),('Huíla'),('Huambo'),('Cabinda'),('Bié'),
  ('Cuanza Norte'),('Cuanza Sul'),('Cunene'),('Lunda Norte'),('Lunda Sul'),
  ('Malanje'),('Moxico'),('Namibe'),('Uíge'),('Zaire'),('Bengo'),('Cuando Cubango')
ON CONFLICT (name) DO NOTHING;

-- Municipios de Luanda (capital, mais relevante)
INSERT INTO public.municipalities (province_id, name, shipping_fee_aoa)
SELECT p.id, m.name, m.fee FROM public.provinces p
CROSS JOIN (VALUES
  ('Luanda', 'Talatona', 2500),
  ('Luanda', 'Belas', 2500),
  ('Luanda', 'Kilamba Kiaxi', 2000),
  ('Luanda', 'Viana', 2500),
  ('Luanda', 'Cazenga', 2000),
  ('Luanda', 'Cacuaco', 3000),
  ('Luanda', 'Ingombota', 1500),
  ('Luanda', 'Maianga', 1500),
  ('Luanda', 'Rangel', 1800),
  ('Luanda', 'Samba', 2000),
  ('Luanda', 'Sambizanga', 1800),
  ('Luanda', 'Icolo e Bengo', 4000),
  ('Benguela', 'Benguela', 5000),
  ('Benguela', 'Lobito', 5000),
  ('Huíla', 'Lubango', 6000),
  ('Huambo', 'Huambo', 6000),
  ('Cabinda', 'Cabinda', 7000)
) AS m(prov, name, fee)
WHERE p.name = m.prov
ON CONFLICT (province_id, name) DO NOTHING;
