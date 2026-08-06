ALTER TABLE public.merchants ALTER COLUMN owner_id DROP NOT NULL;

INSERT INTO public.merchants (id, owner_id, name, slug, category, city, website, logo_url, status, description) VALUES
 ('11111111-0000-4000-8000-000000000001', NULL, 'بنده', 'panda-official', 'سوبرماركت', 'الرياض', 'https://www.panda.com.sa', 'https://logo.clearbit.com/panda.com.sa', 'verified', 'عروض بنده الأسبوعية الرسمية'),
 ('11111111-0000-4000-8000-000000000002', NULL, 'أسواق العثيم', 'othaim-official', 'سوبرماركت', 'الرياض', 'https://www.othaimmarkets.com', 'https://logo.clearbit.com/othaimmarkets.com', 'verified', 'عروض العثيم الرسمية'),
 ('11111111-0000-4000-8000-000000000003', NULL, 'الدانوب', 'danube-official', 'سوبرماركت', 'جدة', 'https://danube.sa', 'https://logo.clearbit.com/danube.sa', 'verified', 'عروض الدانوب الرسمية'),
 ('11111111-0000-4000-8000-000000000004', NULL, 'أسواق التميمي', 'tamimi-official', 'سوبرماركت', 'الخبر', 'https://shop.tamimimarkets.com', 'https://logo.clearbit.com/tamimimarkets.com', 'verified', 'عروض التميمي الرسمية'),
 ('11111111-0000-4000-8000-000000000005', NULL, 'جرير', 'jarir-official', 'إلكترونيات', 'الرياض', 'https://www.jarir.com', 'https://logo.clearbit.com/jarir.com', 'verified', 'عروض جرير على الإلكترونيات'),
 ('11111111-0000-4000-8000-000000000006', NULL, 'إكسترا', 'extra-official', 'إلكترونيات', 'الرياض', 'https://www.extra.com', 'https://logo.clearbit.com/extra.com', 'verified', 'عروض إكسترا اليومية'),
 ('11111111-0000-4000-8000-000000000007', NULL, 'نون', 'noon-official', 'إلكترونيات', 'الرياض', 'https://www.noon.com/saudi-ar/', 'https://logo.clearbit.com/noon.com', 'verified', 'عروض نون السعودية')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.merchant_deals (merchant_id, title, description, category, unit, original_price, price, product_url, status, expires_at) VALUES
 ('11111111-0000-4000-8000-000000000001','أرز بشاور مزة 10 كجم','عرض الأسبوع على الأرز البشاوي','سوبرماركت','كيس 10 كجم',89.00,64.95,'https://www.panda.com.sa','published', now() + interval '10 days'),
 ('11111111-0000-4000-8000-000000000001','زيت عافية دوار الشمس 1.5 لتر','عرض على زيت الطبخ','سوبرماركت','عبوة 1.5 لتر',29.95,21.50,'https://www.panda.com.sa','published', now() + interval '8 days'),
 ('11111111-0000-4000-8000-000000000001','دجاج طازج الوطنية 1 كجم','سعر مخفّض للدجاج الطازج','سوبرماركت','كجم',22.00,16.95,'https://www.panda.com.sa','published', now() + interval '5 days'),
 ('11111111-0000-4000-8000-000000000002','حليب المراعي طويل الأجل 1 لتر × 6','عرض العائلة','سوبرماركت','باكيت 6 حبات',33.00,24.95,'https://www.othaimmarkets.com','published', now() + interval '7 days'),
 ('11111111-0000-4000-8000-000000000002','سكر أسرتي 5 كجم','عرض السكر','سوبرماركت','كيس 5 كجم',24.00,17.95,'https://www.othaimmarkets.com','published', now() + interval '9 days'),
 ('11111111-0000-4000-8000-000000000002','تمر سكري فاخر 1 كجم','عرض التمور','سوبرماركت','كجم',45.00,32.00,'https://www.othaimmarkets.com','published', now() + interval '12 days'),
 ('11111111-0000-4000-8000-000000000003','لحم بقري طازج مفروم 1 كجم','عرض اللحوم الطازجة','سوبرماركت','كجم',54.00,39.90,'https://danube.sa','published', now() + interval '4 days'),
 ('11111111-0000-4000-8000-000000000003','جبن كرافت شرائح 400 جم','عرض الألبان','سوبرماركت','علبة 400 جم',26.50,19.95,'https://danube.sa','published', now() + interval '6 days'),
 ('11111111-0000-4000-8000-000000000004','قهوة عربية مطحونة 500 جم','عرض القهوة','سوبرماركت','كيس 500 جم',39.00,27.95,'https://shop.tamimimarkets.com','published', now() + interval '11 days'),
 ('11111111-0000-4000-8000-000000000004','مناديل فاين 6 حبات','عرض المستلزمات المنزلية','سوبرماركت','باكيت 6',28.00,19.00,'https://shop.tamimimarkets.com','published', now() + interval '14 days'),
 ('11111111-0000-4000-8000-000000000005','آيفون 15 128 جيجا','خصم على الجوالات','إلكترونيات','قطعة',3699.00,3199.00,'https://www.jarir.com/sa-ar/smartphones.html','published', now() + interval '15 days'),
 ('11111111-0000-4000-8000-000000000005','لابتوب HP 15 Core i5','عرض اللابتوبات','إلكترونيات','قطعة',2899.00,2299.00,'https://www.jarir.com/sa-ar/laptops.html','published', now() + interval '10 days'),
 ('11111111-0000-4000-8000-000000000005','سماعة AirPods Pro 2','عرض السماعات','إلكترونيات','قطعة',1049.00,849.00,'https://www.jarir.com/sa-ar/headphones.html','published', now() + interval '9 days'),
 ('11111111-0000-4000-8000-000000000006','شاشة TCL 55 بوصة 4K','عرض الشاشات','إلكترونيات','قطعة',2199.00,1499.00,'https://www.extra.com/ar-sa/tvs/c/2-201','published', now() + interval '7 days'),
 ('11111111-0000-4000-8000-000000000006','غسالة LG 8 كجم','عرض الأجهزة المنزلية','إلكترونيات','قطعة',2399.00,1799.00,'https://www.extra.com/ar-sa/washers/c/2-401','published', now() + interval '13 days'),
 ('11111111-0000-4000-8000-000000000007','ساعة Galaxy Watch 6','عرض نون على الساعات الذكية','إلكترونيات','قطعة',1199.00,799.00,'https://www.noon.com/saudi-ar/','published', now() + interval '6 days'),
 ('11111111-0000-4000-8000-000000000007','مكنسة روبوت شاومي','عرض نون على الأجهزة الذكية','إلكترونيات','قطعة',1399.00,899.00,'https://www.noon.com/saudi-ar/','published', now() + interval '8 days');