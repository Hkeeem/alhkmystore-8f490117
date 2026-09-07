INSERT INTO public.coupons (store_name, store_id, code, title, description, discount, category, source, active)
VALUES ('نون', 'noon', 'HKM11', 'كود خصم نون HKM11', 'استخدم كود HKM11 عند إتمام الشراء من نون للحصول على خصم إضافي على المنتجات المؤهلة.', 'خصم إضافي', 'general', 'merchant', true)
ON CONFLICT DO NOTHING;