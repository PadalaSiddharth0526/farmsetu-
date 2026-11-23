-- Run in Supabase SQL Editor after applying migrations.
SELECT count(*) AS total_seeded,
       count(*) FILTER (WHERE crop_name='Rice') AS rice,
       count(*) FILTER (WHERE crop_name='Toor Dal') AS toor_dal,
       count(*) FILTER (WHERE crop_name='Turmeric') AS turmeric,
       count(*) FILTER (WHERE crop_name='Red Chillies') AS red_chillies,
       count(*) FILTER (WHERE crop_name IN ('Jowar','Bajra')) AS millets,
       count(*) FILTER (WHERE crop_name='Groundnuts') AS groundnuts
FROM public.products WHERE listing_key LIKE 'crowdquote-%';

SELECT listing_key, crop_name, variety, district, raw_price_per_quintal, price AS customer_price_per_kg,
       quantity, pack_sizes, min_order, rollout_phase, is_demo, supplier_verified, price_verified, stock_verified
FROM public.products WHERE listing_key LIKE 'crowdquote-%' ORDER BY listing_key;

SELECT listing_key, count(*) FROM public.products
WHERE listing_key LIKE 'crowdquote-%' GROUP BY listing_key HAVING count(*) > 1;

SELECT listing_key FROM public.products
WHERE listing_key LIKE 'crowdquote-%' AND
 (NOT is_demo OR supplier_verified OR price_verified OR stock_verified
  OR quantity <> CASE WHEN crop_name='Rice' THEN 500 ELSE 100 END
  OR min_order <> CASE WHEN crop_name='Rice' THEN 25 ELSE 5 END
  OR pack_sizes <> CASE WHEN crop_name='Rice' THEN ARRAY[25,50,75,100]::numeric[] ELSE ARRAY[5,10,15]::numeric[] END);
-- NOTE: stock quantity check is valid only before any real inventory movements.
