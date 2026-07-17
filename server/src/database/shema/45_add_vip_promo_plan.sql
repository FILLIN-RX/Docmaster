INSERT INTO plans (id, name, price, interval, features, is_active, is_featured, duration_months)
VALUES ('vip_promo_2m', 'VIP Promo', 1000, 'month', '{"docs_per_type": 5, "objects_limit": 7, "sms_alerts": true, "email_alerts": true, "geo_tracking": true, "priority_support": true, "verified_badge": true, "history_days": 365, "ads_free": true, "export_data": true}', true, false, 2)
ON CONFLICT (id) DO NOTHING;
