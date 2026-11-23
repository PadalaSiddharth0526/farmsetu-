
-- ROLES
CREATE TYPE public.app_role AS ENUM ('farmer','customer','admin');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  phone text,
  email text,
  role text NOT NULL DEFAULT 'customer',
  address text,
  village text,
  district text,
  state text NOT NULL DEFAULT 'Telangana',
  pincode text,
  language text NOT NULL DEFAULT 'en',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "own profile read" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "own profile write" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "own roles read" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

-- FARMERS
CREATE TABLE public.farmers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone text,
  village text,
  mandal text,
  district text NOT NULL DEFAULT 'Hyderabad',
  state text NOT NULL DEFAULT 'Telangana',
  pincode text,
  farm_size numeric NOT NULL DEFAULT 0,
  language text NOT NULL DEFAULT 'en',
  farmer_code text,
  photo_url text,
  approved boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.farmers TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.farmers TO authenticated;
GRANT ALL ON public.farmers TO service_role;
ALTER TABLE public.farmers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "farmers public read" ON public.farmers FOR SELECT USING (true);
CREATE POLICY "farmer self insert" ON public.farmers FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "farmer self update" ON public.farmers FOR UPDATE TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "farmer admin delete" ON public.farmers FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.my_farmer_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id FROM public.farmers WHERE user_id = auth.uid() LIMIT 1
$$;

-- SOIL TESTS
CREATE TABLE public.soil_tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id uuid NOT NULL REFERENCES public.farmers(id) ON DELETE CASCADE,
  ph numeric,
  nitrogen numeric,
  phosphorus numeric,
  potassium numeric,
  organic_carbon numeric,
  electrical_conductivity numeric,
  soil_type text,
  moisture numeric,
  report_file text,
  soil_score integer,
  analysis jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.soil_tests TO authenticated;
GRANT ALL ON public.soil_tests TO service_role;
ALTER TABLE public.soil_tests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "soil own" ON public.soil_tests FOR ALL TO authenticated
  USING (farmer_id = public.my_farmer_id() OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (farmer_id = public.my_farmer_id());

-- CROP RECOMMENDATIONS
CREATE TABLE public.crop_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id uuid NOT NULL REFERENCES public.farmers(id) ON DELETE CASCADE,
  soil_test_id uuid REFERENCES public.soil_tests(id) ON DELETE SET NULL,
  crop_name text NOT NULL,
  suitability_score integer NOT NULL DEFAULT 0,
  reasons jsonb NOT NULL DEFAULT '[]'::jsonb,
  duration_days text,
  water_requirement text,
  yield_range text,
  guidance text,
  market_demand text,
  season text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crop_recommendations TO authenticated;
GRANT ALL ON public.crop_recommendations TO service_role;
ALTER TABLE public.crop_recommendations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reco own" ON public.crop_recommendations FOR ALL TO authenticated
  USING (farmer_id = public.my_farmer_id() OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (farmer_id = public.my_farmer_id());

-- PRODUCTS
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id uuid NOT NULL REFERENCES public.farmers(id) ON DELETE CASCADE,
  crop_name text NOT NULL,
  crop_name_te text,
  category text NOT NULL DEFAULT 'vegetables',
  quantity numeric NOT NULL DEFAULT 0,
  unit text NOT NULL DEFAULT 'kg',
  price numeric NOT NULL DEFAULT 0,
  min_order numeric NOT NULL DEFAULT 1,
  harvest_date date,
  quality text NOT NULL DEFAULT 'A',
  organic boolean NOT NULL DEFAULT false,
  description text,
  image_url text,
  location text,
  delivery_option text NOT NULL DEFAULT 'both',
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "products public read" ON public.products FOR SELECT USING (true);
CREATE POLICY "products farmer insert" ON public.products FOR INSERT TO authenticated WITH CHECK (farmer_id = public.my_farmer_id());
CREATE POLICY "products farmer update" ON public.products FOR UPDATE TO authenticated USING (farmer_id = public.my_farmer_id() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "products farmer delete" ON public.products FOR DELETE TO authenticated USING (farmer_id = public.my_farmer_id() OR public.has_role(auth.uid(),'admin'));

-- ORDERS
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_code text NOT NULL DEFAULT ('TF' || lpad((floor(random()*99999))::text, 5, '0')),
  customer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  farmer_id uuid NOT NULL REFERENCES public.farmers(id) ON DELETE CASCADE,
  customer_name text,
  customer_phone text,
  total_amount numeric NOT NULL DEFAULT 0,
  delivery_fee numeric NOT NULL DEFAULT 0,
  delivery_address text,
  payment_method text NOT NULL DEFAULT 'cod',
  payment_status text NOT NULL DEFAULT 'pending',
  order_status text NOT NULL DEFAULT 'placed',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "orders read" ON public.orders FOR SELECT TO authenticated
  USING (customer_id = auth.uid() OR farmer_id = public.my_farmer_id() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "orders customer insert" ON public.orders FOR INSERT TO authenticated WITH CHECK (customer_id = auth.uid());
CREATE POLICY "orders update" ON public.orders FOR UPDATE TO authenticated
  USING (customer_id = auth.uid() OR farmer_id = public.my_farmer_id() OR public.has_role(auth.uid(),'admin'));

CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  crop_name text NOT NULL,
  quantity numeric NOT NULL DEFAULT 1,
  unit text NOT NULL DEFAULT 'kg',
  price numeric NOT NULL DEFAULT 0
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.order_items TO authenticated;
GRANT ALL ON public.order_items TO service_role;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "order items read" ON public.order_items FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND (o.customer_id = auth.uid() OR o.farmer_id = public.my_farmer_id() OR public.has_role(auth.uid(),'admin'))));
CREATE POLICY "order items insert" ON public.order_items FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.customer_id = auth.uid()));

-- NOTIFICATIONS
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notif own" ON public.notifications FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (true);

-- new user trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, phone, role, village, district, state, pincode, language)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name',''),
    NEW.email,
    NEW.raw_user_meta_data->>'phone',
    COALESCE(NEW.raw_user_meta_data->>'role','customer'),
    NEW.raw_user_meta_data->>'village',
    NEW.raw_user_meta_data->>'district',
    COALESCE(NEW.raw_user_meta_data->>'state','Telangana'),
    NEW.raw_user_meta_data->>'pincode',
    COALESCE(NEW.raw_user_meta_data->>'language','en')
  ) ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'role','customer')::public.app_role)
  ON CONFLICT DO NOTHING;

  IF COALESCE(NEW.raw_user_meta_data->>'role','customer') = 'farmer' THEN
    INSERT INTO public.farmers (user_id, name, phone, village, mandal, district, state, pincode, farm_size, language, farmer_code)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'name','Farmer'),
      NEW.raw_user_meta_data->>'phone',
      NEW.raw_user_meta_data->>'village',
      NEW.raw_user_meta_data->>'mandal',
      COALESCE(NEW.raw_user_meta_data->>'district','Hyderabad'),
      'Telangana',
      NEW.raw_user_meta_data->>'pincode',
      COALESCE((NEW.raw_user_meta_data->>'farm_size')::numeric, 0),
      COALESCE(NEW.raw_user_meta_data->>'language','en'),
      NEW.raw_user_meta_data->>'farmer_code'
    ) ON CONFLICT (user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- DEMO DATA
INSERT INTO public.farmers (id, name, phone, village, mandal, district, farm_size, language, farmer_code, approved) VALUES
('11111111-1111-1111-1111-111111111101','Ramulu Goud','9876500001','Gajwel','Gajwel','Siddipet',6.5,'te','TF-FARM-001',true),
('11111111-1111-1111-1111-111111111102','Lakshmi Devi','9876500002','Choutuppal','Choutuppal','Nalgonda',4.0,'te','TF-FARM-002',true),
('11111111-1111-1111-1111-111111111103','Srinivas Reddy','9876500003','Jangaon','Jangaon','Warangal',12.0,'en','TF-FARM-003',true),
('11111111-1111-1111-1111-111111111104','Anjaiah Yadav','9876500004','Kothagudem','Kothagudem','Khammam',8.25,'te','TF-FARM-004',true);

INSERT INTO public.products (farmer_id, crop_name, crop_name_te, category, quantity, unit, price, min_order, harvest_date, quality, organic, description, location, image_url) VALUES
('11111111-1111-1111-1111-111111111101','Fresh Tomatoes','తాజా టమాటాలు','vegetables',500,'kg',25,5,'2026-08-05','A',true,'Farm fresh tomatoes, hand picked and graded.','Gajwel, Siddipet','https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800&q=80'),
('11111111-1111-1111-1111-111111111102','Sona Masuri Rice','సోనా మసూరి బియ్యం','grains',2000,'kg',52,25,'2026-07-20','A',false,'Premium Sona Masuri paddy milled fresh.','Choutuppal, Nalgonda','https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800&q=80'),
('11111111-1111-1111-1111-111111111103','Raw Cotton','పత్తి','commercial',3000,'kg',72,100,'2026-06-28','A',false,'Long staple cotton, well dried.','Jangaon, Warangal','https://images.unsplash.com/photo-1594892619764-3a4e5f52a2cf?w=800&q=80'),
('11111111-1111-1111-1111-111111111104','Red Gram (Kandi)','కంది పప్పు','pulses',900,'kg',96,10,'2026-07-02','A',true,'Organically grown red gram from Khammam.','Kothagudem, Khammam','https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=800&q=80'),
('11111111-1111-1111-1111-111111111101','Green Chillies','పచ్చి మిరపకాయలు','vegetables',300,'kg',40,5,'2026-08-06','B',false,'Spicy fresh green chillies.','Gajwel, Siddipet','https://images.unsplash.com/photo-1583119912267-cc97c911e416?w=800&q=80'),
('11111111-1111-1111-1111-111111111102','Maize','మొక్కజొన్న','grains',1500,'kg',22,50,'2026-07-15','A',false,'Yellow maize suitable for feed and flour.','Choutuppal, Nalgonda','https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=800&q=80'),
('11111111-1111-1111-1111-111111111103','Turmeric Fingers','పసుపు','spices',600,'kg',115,10,'2026-05-30','A',true,'Sun dried turmeric with high curcumin.','Jangaon, Warangal','https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=800&q=80'),
('11111111-1111-1111-1111-111111111104','Brinjal','వంకాయ','vegetables',250,'kg',28,5,'2026-08-07','A',false,'Tender purple brinjal, harvested daily.','Kothagudem, Khammam','https://images.unsplash.com/photo-1615484477778-ca3b77940c25?w=800&q=80');
