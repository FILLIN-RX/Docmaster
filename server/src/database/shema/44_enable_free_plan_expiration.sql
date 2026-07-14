-- Migration: Enable expiration_management for free plan
UPDATE plans 
SET features = features || jsonb_build_object('expiration_management', true)
WHERE id = 'free';
