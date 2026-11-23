-- CrowdQuote catalog rollout: safe on existing databases.
-- The prior migration defines the 52-row idempotent seed function.
SELECT public.seed_crowdquote_demo_listings();

-- Replace generic remote photos with bundled crop photographs only for demo rows.
-- Do not modify prices, stock, verification or user-created listings.
UPDATE public.products
SET image_url = CASE
  WHEN listing_key LIKE 'crowdquote-rice-%' THEN '/images/crops/rice.jpg'
  WHEN listing_key LIKE 'crowdquote-turmeric-%' THEN '/images/crops/turmeric.jpg'
  WHEN listing_key LIKE 'crowdquote-red-chillies-%' THEN '/images/crops/red-chillies.jpg'
  WHEN listing_key LIKE 'crowdquote-groundnuts-%' THEN '/images/crops/groundnuts.jpg'
  ELSE image_url END
WHERE is_demo = true
  AND listing_key LIKE 'crowdquote-%'
  AND (listing_key LIKE 'crowdquote-rice-%'
       OR listing_key LIKE 'crowdquote-turmeric-%'
       OR listing_key LIKE 'crowdquote-red-chillies-%'
       OR listing_key LIKE 'crowdquote-groundnuts-%')
  AND (image_url IS NULL OR image_url LIKE 'https://images.unsplash.com/%');

-- Prevent duplicate seeded records; preserve existing inventory on repeated deployments.
-- Unverified DEMO listings must remain non-purchasable until approved.
