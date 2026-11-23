ALTER TABLE public.products
  ALTER COLUMN farmer_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS listing_key text,
  ADD COLUMN IF NOT EXISTS variety text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS rollout_phase integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS district text,
  ADD COLUMN IF NOT EXISTS raw_price_per_quintal numeric,
  ADD COLUMN IF NOT EXISTS is_demo boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS supplier_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS price_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS stock_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS organic_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS pack_sizes numeric[] NOT NULL DEFAULT ARRAY[]::numeric[],
  ADD COLUMN IF NOT EXISTS reserved_quantity numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS low_stock_threshold numeric NOT NULL DEFAULT 0;

DO $block$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'products_rollout_phase_check'
      AND conrelid = 'public.products'::regclass
  ) THEN
    ALTER TABLE public.products
      ADD CONSTRAINT products_rollout_phase_check CHECK (rollout_phase BETWEEN 1 AND 3);
  END IF;
END;
$block$;

CREATE UNIQUE INDEX IF NOT EXISTS products_listing_key_unique
  ON public.products (listing_key)
  WHERE listing_key IS NOT NULL;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS reservation_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS inventory_restored_at timestamptz,
  ADD COLUMN IF NOT EXISTS inventory_committed_at timestamptz;

CREATE INDEX IF NOT EXISTS orders_expired_reservations_idx
  ON public.orders (reservation_expires_at)
  WHERE reservation_expires_at IS NOT NULL
    AND inventory_restored_at IS NULL
    AND inventory_committed_at IS NULL;

DROP POLICY IF EXISTS "orders customer insert" ON public.orders;
DROP POLICY IF EXISTS "orders update" ON public.orders;
CREATE POLICY "orders farmer or admin update" ON public.orders
  FOR UPDATE TO authenticated
  USING (farmer_id = public.my_farmer_id() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (farmer_id = public.my_farmer_id() OR public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "order items insert" ON public.order_items;

DROP POLICY IF EXISTS "products farmer update" ON public.products;
CREATE POLICY "products owner or admin update" ON public.products
  FOR UPDATE TO authenticated
  USING (farmer_id = public.my_farmer_id() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (farmer_id = public.my_farmer_id() OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "products farmer insert" ON public.products;
CREATE POLICY "products owner or admin insert" ON public.products
  FOR INSERT TO authenticated
  WITH CHECK (farmer_id = public.my_farmer_id() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "products admin insert" ON public.products
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.guard_product_verification_fields()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  IF auth.uid() IS NOT NULL
     AND NOT public.has_role(auth.uid(), 'admin') THEN
    IF TG_OP = 'INSERT'
       AND (
         NEW.listing_key IS NOT NULL
         OR NEW.rollout_phase <> 1
         OR NEW.is_demo
         OR NEW.supplier_verified
         OR NEW.price_verified
         OR NEW.stock_verified
         OR NEW.organic_verified
         OR NEW.raw_price_per_quintal IS NOT NULL
       ) THEN
      RAISE EXCEPTION 'Only administrators can create demo listings or set supplier, price, stock, and organic verification.';
    END IF;
    IF TG_OP = 'UPDATE'
       AND ROW(
         OLD.farmer_id,
         OLD.listing_key,
         OLD.rollout_phase,
         OLD.raw_price_per_quintal,
         OLD.is_demo,
         OLD.supplier_verified,
         OLD.price_verified,
         OLD.stock_verified,
         OLD.organic_verified,
         OLD.pack_sizes,
         OLD.low_stock_threshold
       ) IS DISTINCT FROM ROW(
         NEW.farmer_id,
         NEW.listing_key,
         NEW.rollout_phase,
         NEW.raw_price_per_quintal,
         NEW.is_demo,
         NEW.supplier_verified,
         NEW.price_verified,
         NEW.stock_verified,
         NEW.organic_verified,
         NEW.pack_sizes,
         NEW.low_stock_threshold
       ) THEN
      RAISE EXCEPTION 'Only administrators can change supplier, verification, procurement, and pack-size fields.';
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS products_guard_verification_fields ON public.products;
CREATE TRIGGER products_guard_verification_fields
  BEFORE INSERT OR UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_product_verification_fields();

-- Retire only the original hard-coded sample listings; preserve their records and stock.
UPDATE public.products
SET status = 'inactive',
    is_demo = true,
    supplier_verified = false,
    price_verified = false,
    stock_verified = false,
    organic_verified = false,
    organic = false
WHERE farmer_id IN (
  '11111111-1111-1111-1111-111111111101'::uuid,
  '11111111-1111-1111-1111-111111111102'::uuid,
  '11111111-1111-1111-1111-111111111103'::uuid,
  '11111111-1111-1111-1111-111111111104'::uuid
);

INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "product images public read" ON storage.objects;
CREATE POLICY "product images public read" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "product images admin insert" ON storage.objects;
CREATE POLICY "product images admin insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "product images admin update" ON storage.objects;
CREATE POLICY "product images admin update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "product images admin delete" ON storage.objects;
CREATE POLICY "product images admin delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.seed_crowdquote_demo_listings()
RETURNS void
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.products (
    farmer_id,
    listing_key,
    crop_name,
    variety,
    category,
    rollout_phase,
    district,
    raw_price_per_quintal,
    price,
    quantity,
    unit,
    min_order,
    pack_sizes,
    low_stock_threshold,
    quality,
    organic,
    organic_verified,
    image_url,
    location,
    description,
    is_demo,
    supplier_verified,
    price_verified,
    stock_verified,
    status
  )
  SELECT
    NULL,
    seed.listing_key,
    seed.crop_name,
    seed.variety,
    seed.category,
    CASE
      WHEN seed.listing_key LIKE 'crowdquote-groundnuts-%' THEN 3
      WHEN seed.listing_key LIKE 'crowdquote-red-chillies-%'
        OR seed.listing_key LIKE 'crowdquote-millet-%' THEN 2
      ELSE 1
    END,
    seed.district,
    seed.raw_price_per_quintal,
    seed.customer_price_per_kg,
    CASE WHEN seed.listing_key LIKE 'crowdquote-rice-%' THEN 500 ELSE 100 END,
    'kg',
    CASE WHEN seed.listing_key LIKE 'crowdquote-rice-%' THEN 25 ELSE 5 END,
    CASE
      WHEN seed.listing_key LIKE 'crowdquote-rice-%'
        THEN ARRAY[25, 50, 75, 100]::numeric[]
      ELSE ARRAY[5, 10, 15]::numeric[]
    END,
    CASE WHEN seed.listing_key LIKE 'crowdquote-rice-%' THEN 100 ELSE 20 END,
    'DEMO / UNVERIFIED',
    false,
    false,
    seed.image_url,
    seed.district,
    'DEMO listing. Supplier, price, and stock are unverified. Purchase is disabled until an administrator verifies the listing.',
    true,
    false,
    false,
    false,
    'active'
  FROM (
    VALUES
      ('crowdquote-rice-peddapalli-bpt-fine', 'Rice', 'BPT Fine', 'grains', 'Peddapalli', 3000, 65, '/images/crops/rice.jpg'),
      ('crowdquote-rice-peddapalli-common-rice', 'Rice', 'Common Rice', 'grains', 'Peddapalli', 2500, 55, '/images/crops/rice.jpg'),
      ('crowdquote-rice-karimnagar-fine-grade-a', 'Rice', 'Fine / Grade A', 'grains', 'Karimnagar', 2752, 60, '/images/crops/rice.jpg'),
      ('crowdquote-rice-jagtial-fine-grade-a', 'Rice', 'Fine / Grade A', 'grains', 'Jagtial', 2671, 58, '/images/crops/rice.jpg'),
      ('crowdquote-rice-jagtial-grade-range-1', 'Rice', 'Grade Range 1', 'grains', 'Jagtial', 3000, 65, '/images/crops/rice.jpg'),
      ('crowdquote-rice-rajanna-sircilla-fine-grade-a', 'Rice', 'Fine / Grade A', 'grains', 'Rajanna Sircilla', 2569, 56, '/images/crops/rice.jpg'),
      ('crowdquote-rice-mancherial-common-rice', 'Rice', 'Common Rice', 'grains', 'Mancherial', 3500, 74, '/images/crops/rice.jpg'),
      ('crowdquote-rice-siddipet-fine-grade-a', 'Rice', 'Fine / Grade A', 'grains', 'Siddipet', 2725, 59, '/images/crops/rice.jpg'),
      ('crowdquote-rice-suryapet-samba-masuri', 'Rice', 'Samba Masuri', 'grains', 'Suryapet', 2767, 60, '/images/crops/rice.jpg'),
      ('crowdquote-rice-khammam-samba-masuri', 'Rice', 'Samba Masuri', 'grains', 'Khammam', 2900, 63, '/images/crops/rice.jpg'),
      ('crowdquote-rice-mahabubabad-hmt', 'Rice', 'HMT', 'grains', 'Mahabubabad', 3189, 68, '/images/crops/rice.jpg'),
      ('crowdquote-rice-mahabubabad-bpt', 'Rice', 'BPT', 'grains', 'Mahabubabad', 3089, 66, '/images/crops/rice.jpg'),
      ('crowdquote-rice-mahabubnagar-common-rice', 'Rice', 'Common Rice', 'grains', 'Mahabubnagar', 3571, 75, '/images/crops/rice.jpg'),
      ('crowdquote-rice-wanaparthy-sona-masuri-old', 'Rice', 'Sona Masuri Old', 'grains', 'Wanaparthy', 2990, 64, '/images/crops/rice.jpg'),
      ('crowdquote-rice-hanumakonda-fine-grade-a', 'Rice', 'Fine / Grade A', 'grains', 'Hanumakonda', 2461, 54, '/images/crops/rice.jpg'),
      ('crowdquote-rice-jangaon-fine-grade-a', 'Rice', 'Fine / Grade A', 'grains', 'Jangaon', 2275, 51, '/images/crops/rice.jpg'),
      ('crowdquote-rice-ranga-reddy-fine-grade-a', 'Rice', 'Fine / Grade A', 'grains', 'Ranga Reddy', 3275, 70, '/images/crops/rice.jpg'),
      ('crowdquote-rice-jayashankar-bhupalapally-common-rice', 'Rice', 'Common Rice', 'grains', 'Jayashankar Bhupalapally', 3000, 65, '/images/crops/rice.jpg'),
      ('crowdquote-rice-jogulamba-gadwal-sona', 'Rice', 'Sona', 'grains', 'Jogulamba Gadwal', 3276, 70, '/images/crops/rice.jpg'),
      ('crowdquote-rice-warangal-ir-64', 'Rice', 'IR-64', 'grains', 'Warangal', 2700, 59, '/images/crops/rice.jpg'),

      ('crowdquote-toor-vikarabad', 'Toor Dal', 'Toor Dal', 'pulses', 'Vikarabad', 7000, 141, 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=900&q=80'),
      ('crowdquote-toor-narayanpet', 'Toor Dal', 'Toor Dal', 'pulses', 'Narayanpet', 6800, 138, 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=900&q=80'),
      ('crowdquote-toor-adilabad', 'Toor Dal', 'Toor Dal', 'pulses', 'Adilabad', 7100, 143, 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=900&q=80'),
      ('crowdquote-toor-sangareddy', 'Toor Dal', 'Toor Dal', 'pulses', 'Sangareddy', 6900, 139, 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=900&q=80'),
      ('crowdquote-toor-mahabubnagar', 'Toor Dal', 'Toor Dal', 'pulses', 'Mahabubnagar', 6800, 138, 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=900&q=80'),
      ('crowdquote-toor-nagarkurnool', 'Toor Dal', 'Toor Dal', 'pulses', 'Nagarkurnool', 7000, 141, 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=900&q=80'),
      ('crowdquote-toor-nirmal', 'Toor Dal', 'Toor Dal', 'pulses', 'Nirmal', 7100, 143, 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=900&q=80'),

      ('crowdquote-turmeric-nizamabad', 'Turmeric', 'Turmeric Powder', 'spices', 'Nizamabad', 13000, 221, '/images/crops/turmeric.jpg'),
      ('crowdquote-turmeric-jagtial', 'Turmeric', 'Turmeric Powder', 'spices', 'Jagtial', 12500, 216, '/images/crops/turmeric.jpg'),
      ('crowdquote-turmeric-nirmal', 'Turmeric', 'Turmeric Powder', 'spices', 'Nirmal', 12000, 211, '/images/crops/turmeric.jpg'),
      ('crowdquote-turmeric-kamareddy', 'Turmeric', 'Turmeric Powder', 'spices', 'Kamareddy', 12500, 216, '/images/crops/turmeric.jpg'),
      ('crowdquote-turmeric-adilabad', 'Turmeric', 'Turmeric Powder', 'spices', 'Adilabad', 12000, 211, '/images/crops/turmeric.jpg'),
      ('crowdquote-turmeric-karimnagar', 'Turmeric', 'Turmeric Powder', 'spices', 'Karimnagar', 12500, 216, '/images/crops/turmeric.jpg'),

      ('crowdquote-red-chillies-khammam', 'Red Chillies', 'Red Chilli Powder', 'spices', 'Khammam', 14000, 246, '/images/crops/red-chillies.jpg'),
      ('crowdquote-red-chillies-warangal', 'Red Chillies', 'Red Chilli Powder', 'spices', 'Warangal', 13500, 241, '/images/crops/red-chillies.jpg'),
      ('crowdquote-red-chillies-mahabubabad', 'Red Chillies', 'Red Chilli Powder', 'spices', 'Mahabubabad', 13000, 236, '/images/crops/red-chillies.jpg'),
      ('crowdquote-red-chillies-suryapet', 'Red Chillies', 'Red Chilli Powder', 'spices', 'Suryapet', 13000, 236, '/images/crops/red-chillies.jpg'),
      ('crowdquote-red-chillies-bhadradri-kothagudem', 'Red Chillies', 'Red Chilli Powder', 'spices', 'Bhadradri Kothagudem', 13500, 241, '/images/crops/red-chillies.jpg'),
      ('crowdquote-red-chillies-mulugu', 'Red Chillies', 'Red Chilli Powder', 'spices', 'Mulugu', 13000, 236, '/images/crops/red-chillies.jpg'),

      ('crowdquote-millet-adilabad-jowar', 'Jowar', 'Jowar', 'grains', 'Adilabad', 3500, 62, 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=900&q=80'),
      ('crowdquote-millet-mahabubnagar-jowar', 'Jowar', 'Jowar', 'grains', 'Mahabubnagar', 3300, 60, 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=900&q=80'),
      ('crowdquote-millet-sangareddy-jowar', 'Jowar', 'Jowar', 'grains', 'Sangareddy', 3400, 61, 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=900&q=80'),
      ('crowdquote-millet-narayanpet-bajra', 'Bajra', 'Bajra', 'grains', 'Narayanpet', 2900, 54, 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=900&q=80'),
      ('crowdquote-millet-vikarabad-jowar', 'Jowar', 'Jowar', 'grains', 'Vikarabad', 3300, 60, 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=900&q=80'),
      ('crowdquote-millet-nagarkurnool-bajra', 'Bajra', 'Bajra', 'grains', 'Nagarkurnool', 3000, 56, 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=900&q=80'),
      ('crowdquote-millet-kamareddy-jowar', 'Jowar', 'Jowar', 'grains', 'Kamareddy', 3400, 61, 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=900&q=80'),

      ('crowdquote-groundnuts-mahabubnagar', 'Groundnuts', 'Groundnut Kernels', 'oilseeds', 'Mahabubnagar', 6000, 121, '/images/crops/groundnuts.jpg'),
      ('crowdquote-groundnuts-wanaparthy', 'Groundnuts', 'Groundnut Kernels', 'oilseeds', 'Wanaparthy', 6200, 124, '/images/crops/groundnuts.jpg'),
      ('crowdquote-groundnuts-nagarkurnool', 'Groundnuts', 'Groundnut Kernels', 'oilseeds', 'Nagarkurnool', 6100, 123, '/images/crops/groundnuts.jpg'),
      ('crowdquote-groundnuts-jogulamba-gadwal', 'Groundnuts', 'Groundnut Kernels', 'oilseeds', 'Jogulamba Gadwal', 6000, 121, '/images/crops/groundnuts.jpg'),
      ('crowdquote-groundnuts-narayanpet', 'Groundnuts', 'Groundnut Kernels', 'oilseeds', 'Narayanpet', 5900, 119, '/images/crops/groundnuts.jpg'),
      ('crowdquote-groundnuts-vikarabad', 'Groundnuts', 'Groundnut Kernels', 'oilseeds', 'Vikarabad', 6100, 123, '/images/crops/groundnuts.jpg')
  ) AS seed (
    listing_key,
    crop_name,
    variety,
    category,
    district,
    raw_price_per_quintal,
    customer_price_per_kg,
    image_url
  )
  ON CONFLICT (listing_key) WHERE listing_key IS NOT NULL DO NOTHING;
END;
$function$;

REVOKE ALL ON FUNCTION public.seed_crowdquote_demo_listings() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.capture_marketplace_order_inventory()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
  item record;
BEGIN
  IF OLD.order_status = 'cancelled' AND NEW.order_status <> 'cancelled' THEN
    RAISE EXCEPTION 'Cancelled orders cannot be reopened.';
  END IF;
  IF OLD.inventory_committed_at IS NOT NULL
     AND NEW.order_status IS DISTINCT FROM OLD.order_status THEN
    RAISE EXCEPTION 'Fulfilled orders cannot be changed.';
  END IF;

  IF NEW.order_status = 'cancelled'
     AND OLD.order_status IS DISTINCT FROM 'cancelled'
     AND OLD.reservation_expires_at IS NOT NULL
     AND OLD.inventory_restored_at IS NULL
     AND OLD.inventory_committed_at IS NULL THEN
    FOR item IN
      SELECT product_id, sum(quantity) AS quantity
      FROM public.order_items
      WHERE order_id = OLD.id AND product_id IS NOT NULL
      GROUP BY product_id
      ORDER BY product_id
    LOOP
      UPDATE public.products
      SET quantity = quantity + item.quantity,
          reserved_quantity = GREATEST(0, reserved_quantity - item.quantity)
      WHERE id = item.product_id;
    END LOOP;
    NEW.inventory_restored_at := now();
  END IF;

  IF NEW.order_status = 'delivered'
     AND OLD.order_status IS DISTINCT FROM 'delivered'
     AND OLD.reservation_expires_at IS NOT NULL
     AND OLD.inventory_committed_at IS NULL
     AND OLD.inventory_restored_at IS NULL THEN
    FOR item IN
      SELECT product_id, sum(quantity) AS quantity
      FROM public.order_items
      WHERE order_id = OLD.id AND product_id IS NOT NULL
      GROUP BY product_id
      ORDER BY product_id
    LOOP
      UPDATE public.products
      SET reserved_quantity = GREATEST(0, reserved_quantity - item.quantity)
      WHERE id = item.product_id;
    END LOOP;
    NEW.inventory_committed_at := now();
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS orders_marketplace_inventory ON public.orders;
CREATE TRIGGER orders_marketplace_inventory
  BEFORE UPDATE OF order_status ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.capture_marketplace_order_inventory();

CREATE OR REPLACE FUNCTION public.release_expired_marketplace_reservations()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
  reservation record;
  released_count integer := 0;
BEGIN
  FOR reservation IN
    SELECT id
    FROM public.orders
    WHERE order_status = 'placed'
      AND reservation_expires_at <= now()
      AND inventory_restored_at IS NULL
      AND inventory_committed_at IS NULL
    FOR UPDATE SKIP LOCKED
  LOOP
    UPDATE public.orders
    SET order_status = 'cancelled'
    WHERE id = reservation.id;
    released_count := released_count + 1;
  END LOOP;
  RETURN released_count;
END;
$function$;

REVOKE ALL ON FUNCTION public.release_expired_marketplace_reservations() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.release_expired_marketplace_reservations() TO anon, authenticated;

DO $block$
DECLARE
  existing_job_id bigint;
BEGIN
  IF EXISTS (SELECT 1 FROM pg_available_extensions WHERE name = 'pg_cron') THEN
    CREATE EXTENSION IF NOT EXISTS pg_cron;
    SELECT jobid
    INTO existing_job_id
    FROM cron.job
    WHERE jobname = 'crowdquote-release-expired-reservations';
    IF existing_job_id IS NOT NULL THEN
      PERFORM cron.unschedule(existing_job_id);
    END IF;
    PERFORM cron.schedule(
      'crowdquote-release-expired-reservations',
      '* * * * *',
      'SELECT public.release_expired_marketplace_reservations();'
    );
  END IF;
END;
$block$;

CREATE OR REPLACE FUNCTION public.place_marketplace_orders(
  p_items jsonb,
  p_customer_name text,
  p_customer_phone text,
  p_delivery_address text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
  customer uuid := auth.uid();
  line record;
  product_row public.products%ROWTYPE;
  farmer_group record;
  new_order_id uuid;
  new_order_code text;
  delivery numeric := 40;
  result jsonb := '[]'::jsonb;
BEGIN
  IF customer IS NULL THEN
    RAISE EXCEPTION 'Sign in before placing an order.';
  END IF;
  IF jsonb_typeof(p_items) IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'Cart items must be supplied as a list.';
  END IF;
  IF jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'The cart is empty.';
  END IF;
  IF EXISTS (
    SELECT 1
    FROM jsonb_to_recordset(p_items) AS requested(
      product_id uuid,
      quantity numeric,
      expected_price numeric
    )
    WHERE requested.product_id IS NULL
       OR requested.quantity IS NULL
       OR requested.quantity <= 0
       OR requested.expected_price IS NULL
  ) THEN
    RAISE EXCEPTION 'Cart items require a valid product and positive quantity.';
  END IF;

  PERFORM public.release_expired_marketplace_reservations();

  FOR line IN
    SELECT requested.product_id,
           sum(requested.quantity) AS quantity,
           min(requested.expected_price) AS min_expected_price,
           max(requested.expected_price) AS max_expected_price
    FROM jsonb_to_recordset(p_items) AS requested(
      product_id uuid,
      quantity numeric,
      expected_price numeric
    )
    GROUP BY requested.product_id
    ORDER BY requested.product_id
  LOOP
    SELECT *
    INTO product_row
    FROM public.products
    WHERE id = line.product_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'A product in your cart no longer exists.';
    END IF;
    IF line.min_expected_price IS DISTINCT FROM product_row.price
       OR line.max_expected_price IS DISTINCT FROM product_row.price THEN
      RAISE EXCEPTION 'The price for % changed. Refresh your cart before ordering.', product_row.crop_name;
    END IF;
    IF product_row.status <> 'active'
       OR NOT product_row.supplier_verified
       OR NOT product_row.price_verified
       OR NOT product_row.stock_verified
       OR product_row.farmer_id IS NULL THEN
      RAISE EXCEPTION 'This listing is not verified and available for purchase.';
    END IF;
    IF product_row.quantity < line.quantity THEN
      RAISE EXCEPTION 'Insufficient stock for %.', product_row.crop_name;
    END IF;
    IF line.quantity < product_row.min_order
       OR NOT (line.quantity = ANY(product_row.pack_sizes)) THEN
      RAISE EXCEPTION 'The quantity for % must match an available pack size.', product_row.crop_name;
    END IF;

    UPDATE public.products
    SET quantity = quantity - line.quantity,
        reserved_quantity = reserved_quantity + line.quantity
    WHERE id = product_row.id;
  END LOOP;

  FOR farmer_group IN
    SELECT product_row.farmer_id,
           sum(requested.quantity * product_row.price) AS subtotal
    FROM jsonb_to_recordset(p_items) AS requested(
      product_id uuid,
      quantity numeric,
      expected_price numeric
    )
    JOIN public.products AS product_row ON product_row.id = requested.product_id
    GROUP BY product_row.farmer_id
    ORDER BY product_row.farmer_id
  LOOP
    INSERT INTO public.orders (
      customer_id,
      farmer_id,
      customer_name,
      customer_phone,
      delivery_address,
      total_amount,
      delivery_fee,
      payment_method,
      payment_status,
      order_status,
      reservation_expires_at
    )
    VALUES (
      customer,
      farmer_group.farmer_id,
      NULLIF(btrim(p_customer_name), ''),
      NULLIF(btrim(p_customer_phone), ''),
      NULLIF(btrim(p_delivery_address), ''),
      farmer_group.subtotal + delivery,
      delivery,
      'cod',
      'pending',
      'placed',
      now() + interval '30 minutes'
    )
    RETURNING id, order_code INTO new_order_id, new_order_code;

    INSERT INTO public.order_items (order_id, product_id, crop_name, price, quantity, unit)
    SELECT
      new_order_id,
      product_row.id,
      concat_ws(' - ', product_row.crop_name, NULLIF(product_row.variety, '')),
      product_row.price,
      sum(requested.quantity),
      product_row.unit
    FROM jsonb_to_recordset(p_items) AS requested(
      product_id uuid,
      quantity numeric,
      expected_price numeric
    )
    JOIN public.products AS product_row ON product_row.id = requested.product_id
    WHERE product_row.farmer_id = farmer_group.farmer_id
    GROUP BY product_row.id, product_row.crop_name, product_row.variety, product_row.price, product_row.unit;

    result := result || jsonb_build_array(
      jsonb_build_object(
        'order_id', new_order_id,
        'order_code', new_order_code,
        'farmer_id', farmer_group.farmer_id,
        'total_amount', farmer_group.subtotal + delivery
      )
    );
  END LOOP;

  RETURN result;
END;
$function$;

REVOKE ALL ON FUNCTION public.place_marketplace_orders(jsonb, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.place_marketplace_orders(jsonb, text, text, text) TO authenticated;

SELECT public.seed_crowdquote_demo_listings();
