CREATE TABLE public.car_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  brand text NOT NULL,
  model text,
  year int NOT NULL DEFAULT 2024,
  city text NOT NULL,
  price numeric NOT NULL,
  original_price numeric,
  mileage_km int NOT NULL DEFAULT 0,
  fuel text NOT NULL DEFAULT 'بنزين',
  transmission text NOT NULL DEFAULT 'أوتوماتيك',
  body_type text NOT NULL DEFAULT 'سيدان',
  condition text NOT NULL DEFAULT 'جديد',
  seats int NOT NULL DEFAULT 5,
  color text,
  dealer text,
  phone text,
  image_url text,
  link_url text,
  features text[] NOT NULL DEFAULT '{}',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.car_listings TO anon;
GRANT SELECT ON public.car_listings TO authenticated;
GRANT ALL ON public.car_listings TO service_role;

ALTER TABLE public.car_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "car_listings public read active" ON public.car_listings
  FOR SELECT TO anon, authenticated USING (active = true);

CREATE POLICY "car_listings staff manage" ON public.car_listings
  FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE TRIGGER car_listings_set_updated_at BEFORE UPDATE ON public.car_listings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX car_listings_city_idx ON public.car_listings (city);
CREATE INDEX car_listings_price_idx ON public.car_listings (price);

INSERT INTO public.car_listings (title, brand, model, year, city, price, original_price, mileage_km, fuel, transmission, body_type, condition, seats, color, dealer, image_url, link_url, features) VALUES
('تويوتا كامري LE 2025','تويوتا','كامري',2025,'الرياض',109900,118000,0,'بنزين','أوتوماتيك','سيدان','جديد',5,'أبيض','وكالة عبداللطيف جميل',null,'https://www.toyota.com.sa','{"شاشة لمس","كاميرا خلفية","مثبت سرعة"}'),
('هيونداي سوناتا سمارت 2025','هيونداي','سوناتا',2025,'جدة',99500,105000,0,'بنزين','أوتوماتيك','سيدان','جديد',5,'أسود','الوعلان للسيارات',null,'https://www.hyundai.com/sa','{"حساسات ركن","بلوتوث","مقاعد جلد"}'),
('نيسان باترول SE 2024','نيسان','باترول',2024,'الرياض',239000,255000,12000,'بنزين','أوتوماتيك','دفع رباعي','مستعمل',7,'فضي','معرض النخبة',null,'https://www.nissan-sa.com','{"دفع رباعي","فتحة سقف","شاشات خلفية"}'),
('كيا سبورتاج 2025','كيا','سبورتاج',2025,'الدمام',115000,122000,0,'بنزين','أوتوماتيك','كروس أوفر','جديد',5,'رمادي','الجبر للسيارات',null,'https://www.kia.com/sa','{"كاميرا 360","تحكم مناخي","حساسات"}'),
('لكزس ES 350 2024','لكزس','ES 350',2024,'الرياض',249000,265000,8000,'بنزين','أوتوماتيك','سيدان','مستعمل',5,'أبيض لؤلؤي','معرض الفخامة',null,'https://www.lexus.com.sa','{"مقاعد مدفأة","نظام صوتي","فتحة سقف"}'),
('شيفروليه تاهو LS 2024','شيفروليه','تاهو',2024,'جدة',215000,229000,15000,'بنزين','أوتوماتيك','دفع رباعي','مستعمل',8,'أسود','الجميح للسيارات',null,'https://www.chevrolet.com.sa','{"7 مقاعد","كاميرا خلفية","دفع رباعي"}'),
('تويوتا هايلكس GLX 2025','تويوتا','هايلكس',2025,'بريدة',124000,132000,0,'ديزل','عادي','بيك أب','جديد',5,'أبيض','عبداللطيف جميل',null,'https://www.toyota.com.sa','{"دفع رباعي","ونش","مكيف"}'),
('هوندا أكورد LX 2025','هوندا','أكورد',2025,'مكة المكرمة',112000,119000,0,'بنزين','أوتوماتيك','سيدان','جديد',5,'أزرق','عبدالله هاشم',null,'https://www.honda.com.sa','{"شاشة أندرويد","مثبت سرعة","حساسات"}'),
('جيتور دشينغ 2025','جيتور','دشينغ',2025,'الرياض',86900,92000,0,'بنزين','أوتوماتيك','كروس أوفر','جديد',5,'أحمر','وكالة الجبر',null,'https://www.jetour-sa.com','{"فتحة سقف","شاشة كبيرة","كاميرا 360"}'),
('مرسيدس C200 2024','مرسيدس','C200',2024,'جدة',289000,310000,9000,'بنزين','أوتوماتيك','سيدان','مستعمل',5,'أسود','الجفالي',null,'https://www.mercedes-benz.com.sa','{"مقاعد جلد","نظام Burmester","فتحة بانوراما"}'),
('فورد إكسبلورر 2024','فورد','إكسبلورر',2024,'الدمام',198000,212000,20000,'بنزين','أوتوماتيك','دفع رباعي','مستعمل',7,'رمادي','الحاج حسين علي رضا',null,'https://www.ford.sa','{"7 مقاعد","دفع رباعي","شاشة لمس"}'),
('MG ZS 2025','MG','ZS',2025,'المدينة المنورة',74900,79000,0,'بنزين','أوتوماتيك','كروس أوفر','جديد',5,'أبيض','معرض السلام',null,'https://www.mgmotor.com.sa','{"كاميرا خلفية","بلوتوث","حساسات ركن"}');