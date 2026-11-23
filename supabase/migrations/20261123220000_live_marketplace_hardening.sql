-- Live marketplace hardening. Keep this migration after the original V1 schema migrations.
-- The original sample records are removed by fixed IDs only; user-owned records are never touched.
DELETE FROM public.products WHERE is_demo=true AND farmer_id IN (
 '11111111-1111-1111-1111-111111111101','11111111-1111-1111-1111-111111111102',
 '11111111-1111-1111-1111-111111111103','11111111-1111-1111-1111-111111111104');
DELETE FROM public.farmers WHERE user_id IS NULL AND id IN (
 '11111111-1111-1111-1111-111111111101','11111111-1111-1111-1111-111111111102',
 '11111111-1111-1111-1111-111111111103','11111111-1111-1111-1111-111111111104');
ALTER TABLE public.farmers ALTER COLUMN approved SET DEFAULT false;
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE requested_role text := coalesce(NEW.raw_user_meta_data->>'role','customer');
BEGIN
 IF requested_role NOT IN ('farmer','customer') THEN requested_role := 'customer'; END IF;
 INSERT INTO public.profiles(id,name,email,phone,role,village,district,state,pincode,language)
 VALUES(NEW.id,coalesce(NEW.raw_user_meta_data->>'name',''),NEW.email,NEW.raw_user_meta_data->>'phone',
 requested_role,NEW.raw_user_meta_data->>'village',NEW.raw_user_meta_data->>'district','Telangana',
 NEW.raw_user_meta_data->>'pincode',coalesce(NEW.raw_user_meta_data->>'language','en'))
 ON CONFLICT(id) DO NOTHING;
 INSERT INTO public.user_roles(user_id,role) VALUES(NEW.id,requested_role::public.app_role)
 ON CONFLICT DO NOTHING;
 IF requested_role='farmer' THEN
 INSERT INTO public.farmers(user_id,name,phone,village,mandal,district,state,pincode,farm_size,language,approved)
 VALUES(NEW.id,coalesce(NEW.raw_user_meta_data->>'name','Farmer'),NEW.raw_user_meta_data->>'phone',
 NEW.raw_user_meta_data->>'village',NEW.raw_user_meta_data->>'mandal',
 coalesce(NEW.raw_user_meta_data->>'district','Hyderabad'),'Telangana',NEW.raw_user_meta_data->>'pincode',
 0,coalesce(NEW.raw_user_meta_data->>'language','en'),false)
 ON CONFLICT(user_id) DO NOTHING;
 END IF;
 RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM public,anon,authenticated;
CREATE OR REPLACE FUNCTION public.guard_farmer_approval()
RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
 IF NEW.approved IS DISTINCT FROM OLD.approved AND NOT public.has_role(auth.uid(),'admin') THEN
 RAISE EXCEPTION 'Only administrators can approve farmer accounts';
 END IF;
 IF NEW.user_id IS DISTINCT FROM OLD.user_id AND NOT public.has_role(auth.uid(),'admin') THEN
 RAISE EXCEPTION 'Farmer ownership cannot be changed';
 END IF;
 RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS guard_farmer_approval_trigger ON public.farmers;
CREATE TRIGGER guard_farmer_approval_trigger BEFORE UPDATE ON public.farmers
FOR EACH ROW EXECUTE FUNCTION public.guard_farmer_approval();
REVOKE ALL ON FUNCTION public.guard_farmer_approval() FROM public,anon,authenticated;

-- SECURITY DEFINER RPCs are not public API endpoints.
REVOKE EXECUTE ON FUNCTION public.advance_group_order(uuid,text) FROM public,anon;
REVOKE EXECUTE ON FUNCTION public.capture_marketplace_order_inventory() FROM public,anon,authenticated;
REVOKE EXECUTE ON FUNCTION public.join_purchase_group(uuid,integer) FROM public,anon;
REVOKE EXECUTE ON FUNCTION public.place_group_order(uuid,uuid) FROM public,anon;
REVOKE EXECUTE ON FUNCTION public.release_expired_marketplace_reservations() FROM public,anon;
GRANT EXECUTE ON FUNCTION public.join_purchase_group(uuid,integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.advance_group_order(uuid,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.place_group_order(uuid,uuid) TO authenticated;
