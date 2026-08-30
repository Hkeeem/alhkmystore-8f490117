import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import {
  BadgeCheck,
  BedDouble,
  Building2,
  CheckCircle2,
  ChevronLeft,
  Home,
  Loader2,
  MapPin,
  MessageCircle,
  Search,
  ShieldCheck,
  Sparkles,
  UsersRound,
  WalletCards,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { getSaudiCities, getSaudiDistricts, SAUDI_REGIONS } from "@/data/saudi-locations";
import {
  FEATURES,
  PROPERTY_TYPES,
  PURPOSES,
  SERVICES,
  type BuyerMatch,
  createWhatsAppMatchLink,
  scoreTone,
  toggleSelection,
} from "@/lib/reverse-property-matchmaking";
import { matchBuyersForProperty, submitBuyerRequest } from "@/lib/reverse-property-matchmaking.functions";

export const Route = createFileRoute("/real-estate")({
  head: () => ({
    meta: [
      { title: "البحث العقاري الذكي — HkeeemAI" },
      { name: "description", content: "مطابقة عقارية ذكية تجمع الباحثين والمعلنين وفق الموقع والميزانية والمميزات." },
    ],
  }),
  component: RealEstate,
});

type PortalMode = "seeker" | "advertiser";
type Purpose = (typeof PURPOSES)[number];

type LocationValue = {
  region: string;
  city: string;
  district: string;
};

type PropertyForm = LocationValue & {
  purpose: Purpose;
  propertyType: string;
  price: string;
  bedrooms: string;
  features: string[];
  services: string[];
};

const EMPTY_LOCATION: LocationValue = { region: "", city: "", district: "" };

const EMPTY_PROPERTY: PropertyForm = {
  ...EMPTY_LOCATION,
  purpose: "شراء",
  propertyType: "شقة",
  price: "",
  bedrooms: "2",
  features: [],
  services: [],
};

function FieldLabel({ children, icon }: { children: string; icon?: React.ReactNode }) {
  return (
    <label className="mb-2 flex items-center gap-2 text-sm font-black text-foreground">
      {icon}
      {children}
    </label>
  );
}

function ChoiceChips({
  items,
  selected,
  onToggle,
  label,
}: {
  items: readonly string[];
  selected: string[];
  onToggle: (value: string) => void;
  label: string;
}) {
  return (
    <fieldset className="rounded-3xl border border-border/60 bg-card p-4 shadow-card">
      <legend className="sr-only">{label}</legend>
      <FieldLabel>{label}</FieldLabel>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => {
          const active = selected.includes(item);
          return (
            <button
              key={item}
              type="button"
              aria-pressed={active}
              onClick={() => onToggle(item)}
              className={`rounded-2xl px-3 py-2 text-xs font-bold transition-colors ${
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-secondary text-secondary-foreground hover:bg-primary/10"
              }`}
            >
              {item}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

function LocationFields({
  value,
  onChange,
}: {
  value: LocationValue;
  onChange: (value: LocationValue) => void;
}) {
  const cities = useMemo(() => getSaudiCities(value.region), [value.region]);
  const districts = useMemo(() => getSaudiDistricts(value.region, value.city), [value.region, value.city]);

  return (
    <section className="rounded-3xl border border-border/60 bg-card p-4 shadow-card">
      <FieldLabel icon={<MapPin className="h-4 w-4 text-primary" />}>الموقع في المملكة</FieldLabel>
      <div className="grid gap-3 sm:grid-cols-3">
        <select
          aria-label="المنطقة"
          value={value.region}
          onChange={(event) => onChange({ region: event.target.value, city: "", district: "" })}
          className="h-12 w-full rounded-2xl border border-border bg-secondary px-3 text-sm font-bold text-foreground outline-none focus:border-primary"
        >
          <option value="">اختر المنطقة</option>
          {SAUDI_REGIONS.map((region) => (
            <option key={region} value={region}>{region}</option>
          ))}
        </select>
        <select
          aria-label="المدينة"
          value={value.city}
          disabled={!value.region}
          onChange={(event) => onChange({ ...value, city: event.target.value, district: "" })}
          className="h-12 w-full rounded-2xl border border-border bg-secondary px-3 text-sm font-bold text-foreground outline-none focus:border-primary disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="">اختر المدينة</option>
          {cities.map((city) => (
            <option key={city} value={city}>{city}</option>
          ))}
        </select>
        <select
          aria-label="الحي"
          value={value.district}
          disabled={!value.city}
          onChange={(event) => onChange({ ...value, district: event.target.value })}
          className="h-12 w-full rounded-2xl border border-border bg-secondary px-3 text-sm font-bold text-foreground outline-none focus:border-primary disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="">اختر الحي</option>
          {districts.map((district) => (
            <option key={district} value={district}>{district}</option>
          ))}
        </select>
      </div>
      {value.city && districts.length === 0 && (
        <p className="mt-3 rounded-2xl bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-800 dark:text-amber-300">
          لا تتوفر أحياء موثقة لهذه المدينة في المصدر الحالي؛ اكتب الحي عند استكمال بيانات الموقع.
        </p>
      )}
    </section>
  );
}

function PurposeAndTypeFields({
  purpose,
  propertyType,
  onPurposeChange,
  onTypeChange,
}: {
  purpose: Purpose;
  propertyType: string;
  onPurposeChange: (value: Purpose) => void;
  onTypeChange: (value: string) => void;
}) {
  return (
    <section className="rounded-3xl border border-border/60 bg-card p-4 shadow-card">
      <FieldLabel icon={<Home className="h-4 w-4 text-primary" />}>نوع الطلب والعقار</FieldLabel>
      <div className="mb-4 grid grid-cols-2 gap-2">
        {PURPOSES.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => onPurposeChange(item)}
            className={`h-11 rounded-2xl text-sm font-black transition-colors ${purpose === item ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}
          >
            {item === "شراء" ? "شراء" : "إيجار"}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {PROPERTY_TYPES.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => onTypeChange(type)}
            className={`rounded-2xl px-3 py-2 text-sm font-bold transition-colors ${propertyType === type ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-primary/10"}`}
          >
            {type}
          </button>
        ))}
      </div>
    </section>
  );
}

function BuyerRequestPanel() {
  const { user } = useAuth();
  const submitRequest = useServerFn(submitBuyerRequest);
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    ...EMPTY_PROPERTY,
    contactConsent: false,
  });
  const saveMutation = useMutation({
    mutationFn: () => submitRequest({
      data: {
        fullName: form.fullName,
        phone: form.phone,
        purpose: form.purpose,
        city: form.city,
        district: form.district,
        propertyType: form.propertyType,
        maxPrice: Number(form.price),
        minBedrooms: Number(form.bedrooms),
        features: form.features,
        requiredServices: form.services,
        contactConsent: true,
      },
    }),
    onSuccess: () => toast.success("تم تسجيل طلبك. سنطابقه مع العقارات المناسبة."),
    onError: (error) => toast.error(error instanceof Error ? error.message : "تعذر حفظ طلب البحث."),
  });

  const updateLocation = (location: LocationValue) => setForm((current) => ({ ...current, ...location }));

  const handleSubmit = () => {
    if (!user) {
      toast.error("سجّل الدخول أولاً لحفظ طلبك وحماية بيانات التواصل.");
      return;
    }
    if (!form.fullName.trim() || !form.phone.trim() || !form.region || !form.city || !form.district || !Number(form.price) || !form.contactConsent) {
      toast.error("أكمل بيانات التواصل والموقع والميزانية ووافق على التواصل للمتابعة.");
      return;
    }
    saveMutation.mutate();
  };

  return (
    <section aria-labelledby="seeker-form-title" className="space-y-4">
      <div className="rounded-3xl border border-primary/20 bg-primary/5 p-4">
        <h2 id="seeker-form-title" className="flex items-center gap-2 text-lg font-black text-foreground"><Search className="h-5 w-5 text-primary" /> سجّل طلبك العقاري</h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">حدّد ما تبحث عنه، وسنستخدم المعايير نفسها لمطابقة المعلنين بعقارك عند وصوله.</p>
      </div>

      {!user && (
        <div className="rounded-3xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-900 dark:text-amber-200">
          تحتاج إلى حساب لحفظ الطلب وإدارة بيانات التواصل. <Link to="/auth" className="font-black underline">تسجيل الدخول</Link>
        </div>
      )}

      <div className="grid gap-3 rounded-3xl border border-border/60 bg-card p-4 shadow-card sm:grid-cols-2">
        <div>
          <FieldLabel>الاسم الكامل</FieldLabel>
          <input value={form.fullName} onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))} placeholder="اسم الباحث" className="h-12 w-full rounded-2xl border border-border bg-secondary px-3 text-sm font-bold outline-none focus:border-primary" />
        </div>
        <div>
          <FieldLabel>رقم الجوال</FieldLabel>
          <input inputMode="tel" dir="ltr" value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} placeholder="05XXXXXXXX" className="h-12 w-full rounded-2xl border border-border bg-secondary px-3 text-right text-sm font-bold outline-none focus:border-primary" />
        </div>
      </div>

      <PurposeAndTypeFields purpose={form.purpose} propertyType={form.propertyType} onPurposeChange={(purpose) => setForm((current) => ({ ...current, purpose }))} onTypeChange={(propertyType) => setForm((current) => ({ ...current, propertyType }))} />
      <LocationFields value={form} onChange={updateLocation} />

      <div className="grid gap-3 rounded-3xl border border-border/60 bg-card p-4 shadow-card sm:grid-cols-2">
        <div>
          <FieldLabel icon={<WalletCards className="h-4 w-4 text-primary" />}>الميزانية القصوى (ر.س)</FieldLabel>
          <input type="number" min="1" value={form.price} onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))} placeholder="مثال: 900000" className="h-12 w-full rounded-2xl border border-border bg-secondary px-3 text-sm font-bold outline-none focus:border-primary" />
        </div>
        <div>
          <FieldLabel icon={<BedDouble className="h-4 w-4 text-primary" />}>الحد الأدنى للغرف</FieldLabel>
          <input type="number" min="0" max="20" value={form.bedrooms} onChange={(event) => setForm((current) => ({ ...current, bedrooms: event.target.value }))} className="h-12 w-full rounded-2xl border border-border bg-secondary px-3 text-sm font-bold outline-none focus:border-primary" />
        </div>
      </div>

      <ChoiceChips label="المميزات المطلوبة" items={FEATURES} selected={form.features} onToggle={(value) => setForm((current) => ({ ...current, features: toggleSelection(current.features, value) }))} />
      <ChoiceChips label="الخدمات المطلوبة" items={SERVICES} selected={form.services} onToggle={(value) => setForm((current) => ({ ...current, services: toggleSelection(current.services, value) }))} />

      <label className="flex cursor-pointer items-start gap-3 rounded-3xl border border-border/60 bg-card p-4 text-sm leading-6 text-muted-foreground shadow-card">
        <input type="checkbox" checked={form.contactConsent} onChange={(event) => setForm((current) => ({ ...current, contactConsent: event.target.checked }))} className="mt-1 h-4 w-4 accent-primary" />
        <span><strong className="text-foreground">أوافق على التواصل بشأن طلب البحث.</strong> لن يُعرض رقمي إلا لمعلنين لديهم عقار متوافق ومن خلال نتيجة المطابقة.</span>
      </label>

      <button type="button" disabled={saveMutation.isPending} onClick={handleSubmit} className="flex h-14 w-full items-center justify-center gap-2 rounded-3xl bg-primary text-base font-black text-primary-foreground shadow-glow transition-transform active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60">
        {saveMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
        تأكيد طلب البحث
      </button>
    </section>
  );
}

function MatchBadge({ score }: { score: number }) {
  const tone = scoreTone(score);
  const className = tone === "success" ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" : tone === "warning" ? "bg-amber-500/15 text-amber-800 dark:text-amber-200" : "bg-secondary text-secondary-foreground";
  return <span className={`inline-flex rounded-full px-3 py-1 text-sm font-black ${className}`}>{score}% تطابق</span>;
}

function BuyerMatchCard({ match, property }: { match: BuyerMatch; property: PropertyForm }) {
  const whatsappLink = createWhatsAppMatchLink(match, {
    city: property.city,
    district: property.district,
    propertyType: property.propertyType,
    price: Number(property.price),
    bedrooms: Number(property.bedrooms),
  });

  return (
    <article className="rounded-3xl border border-border/60 bg-card p-4 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-black text-foreground">{match.full_name}</h3>
            {match.is_demo && <span className="rounded-full bg-sky-500/10 px-2 py-1 text-[11px] font-black text-sky-700 dark:text-sky-300">بيانات تجريبية</span>}
          </div>
          <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3.5 w-3.5" /> {match.district}، {match.city}</p>
        </div>
        <MatchBadge score={match.match_score} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
        <div className="rounded-2xl bg-secondary p-3"><span className="block text-xs text-muted-foreground">الميزانية القصوى</span><strong>{Number(match.max_price).toLocaleString("ar-SA")} ر.س</strong></div>
        <div className="rounded-2xl bg-secondary p-3"><span className="block text-xs text-muted-foreground">العقار المطلوب</span><strong>{match.property_type} · {match.min_bedrooms}+ غرف</strong></div>
      </div>

      {(match.features.length > 0 || match.required_services.length > 0) && (
        <p className="mt-3 text-xs leading-5 text-muted-foreground">المميزات والخدمات: {[...match.features, ...match.required_services].slice(0, 4).join("، ")}</p>
      )}

      {whatsappLink ? (
        <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="mt-4 flex h-11 items-center justify-center gap-2 rounded-2xl bg-emerald-600 text-sm font-black text-white transition-colors hover:bg-emerald-700">
          <MessageCircle className="h-4 w-4" /> تواصل عبر واتساب
        </a>
      ) : (
        <div className="mt-4 flex h-11 items-center justify-center gap-2 rounded-2xl bg-secondary text-sm font-bold text-muted-foreground"><ShieldCheck className="h-4 w-4" /> التواصل متاح للطلبات الفعلية فقط</div>
      )}
    </article>
  );
}

function AdvertiserPanel() {
  const { user } = useAuth();
  const matchBuyers = useServerFn(matchBuyersForProperty);
  const [property, setProperty] = useState<PropertyForm>(EMPTY_PROPERTY);
  const [matches, setMatches] = useState<BuyerMatch[]>([]);
  const matchMutation = useMutation({
    mutationFn: () => matchBuyers({
      data: {
        purpose: property.purpose,
        city: property.city,
        district: property.district,
        propertyType: property.propertyType,
        price: Number(property.price),
        bedrooms: Number(property.bedrooms),
        features: property.features,
        requiredServices: property.services,
      },
    }),
    onSuccess: (data) => {
      const resolvedMatches = (Array.isArray(data) ? data : []) as BuyerMatch[];
      setMatches(resolvedMatches);
      toast.success(resolvedMatches.length ? `وجدنا ${resolvedMatches.length} مشتريًا متوافقًا.` : "لا توجد طلبات متوافقة حاليًا.");
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "تعذر تنفيذ المطابقة."),
  });

  const updateLocation = (location: LocationValue) => setProperty((current) => ({ ...current, ...location }));
  const handleMatch = () => {
    if (!user) {
      toast.error("سجّل الدخول أولاً لعرض بيانات التواصل للطلبات المتوافقة.");
      return;
    }
    if (!property.region || !property.city || !property.district || !Number(property.price)) {
      toast.error("أكمل الموقع والسعر وعدد الغرف قبل تنفيذ المطابقة.");
      return;
    }
    matchMutation.mutate();
  };

  return (
    <section aria-labelledby="advertiser-form-title" className="space-y-4">
      <div className="rounded-3xl border border-primary/20 bg-primary/5 p-4">
        <h2 id="advertiser-form-title" className="flex items-center gap-2 text-lg font-black text-foreground"><Building2 className="h-5 w-5 text-primary" /> إضافة عقار للمطابقة</h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">أدخل تفاصيل العقار، ثم اعرض الباحثين المتوافقين بترتيب نسبة التطابق.</p>
      </div>

      {!user && <div className="rounded-3xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-900 dark:text-amber-200">تحتاج إلى حساب لاستخدام ميزة المطابقة. <Link to="/auth" className="font-black underline">تسجيل الدخول</Link></div>}

      <PurposeAndTypeFields purpose={property.purpose} propertyType={property.propertyType} onPurposeChange={(purpose) => setProperty((current) => ({ ...current, purpose }))} onTypeChange={(propertyType) => setProperty((current) => ({ ...current, propertyType }))} />
      <LocationFields value={property} onChange={updateLocation} />

      <div className="grid gap-3 rounded-3xl border border-border/60 bg-card p-4 shadow-card sm:grid-cols-2">
        <div>
          <FieldLabel icon={<WalletCards className="h-4 w-4 text-primary" />}>سعر العقار (ر.س)</FieldLabel>
          <input type="number" min="1" value={property.price} onChange={(event) => setProperty((current) => ({ ...current, price: event.target.value }))} placeholder="مثال: 850000" className="h-12 w-full rounded-2xl border border-border bg-secondary px-3 text-sm font-bold outline-none focus:border-primary" />
        </div>
        <div>
          <FieldLabel icon={<BedDouble className="h-4 w-4 text-primary" />}>عدد الغرف</FieldLabel>
          <input type="number" min="0" max="20" value={property.bedrooms} onChange={(event) => setProperty((current) => ({ ...current, bedrooms: event.target.value }))} className="h-12 w-full rounded-2xl border border-border bg-secondary px-3 text-sm font-bold outline-none focus:border-primary" />
        </div>
      </div>

      <ChoiceChips label="مميزات العقار" items={FEATURES} selected={property.features} onToggle={(value) => setProperty((current) => ({ ...current, features: toggleSelection(current.features, value) }))} />
      <ChoiceChips label="الخدمات القريبة والمتاحة" items={SERVICES} selected={property.services} onToggle={(value) => setProperty((current) => ({ ...current, services: toggleSelection(current.services, value) }))} />

      <button type="button" disabled={matchMutation.isPending} onClick={handleMatch} className="flex h-14 w-full items-center justify-center gap-2 rounded-3xl bg-primary text-base font-black text-primary-foreground shadow-glow transition-transform active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60">
        {matchMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <UsersRound className="h-5 w-5" />}
        مطابقة الباحثين
      </button>

      {(matches.length > 0 || matchMutation.isSuccess) && (
        <section aria-live="polite" className="space-y-3 rounded-[2rem] border border-emerald-500/25 bg-emerald-500/[0.04] p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-500 text-white"><UsersRound className="h-5 w-5" /></div>
            <div>
              <h2 className="font-black text-foreground">المشترون المهتمون بعقارك ذكياً</h2>
              <p className="mt-1 text-sm text-muted-foreground">{matches.length ? "رتّبنا الطلبات وفق الموقع والميزانية والغرف والمميزات والخدمات." : "لا توجد طلبات تتجاوز حد المطابقة الحالي. جرّب تعديل التفاصيل لاحقًا."}</p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {matches.map((match) => <BuyerMatchCard key={match.id} match={match} property={property} />)}
          </div>
        </section>
      )}
    </section>
  );
}

function RealEstate() {
  const [mode, setMode] = useState<PortalMode>("seeker");
  return (
    <main dir="rtl" className="mx-auto max-w-3xl space-y-6 px-4 pb-20 pt-6">
      <section className="relative overflow-hidden rounded-[2rem] bg-gradient-hero p-6 text-primary-foreground shadow-glow">
        <div className="absolute -left-10 -top-16 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
        <div className="relative flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 backdrop-blur"><Building2 className="h-6 w-6" /></div>
          <div>
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-xs font-bold"><Sparkles className="h-3 w-3" /> ذكاء اصطناعي</div>
            <h1 className="font-display text-2xl font-black">البحث العقاري الذكي</h1>
            <p className="mt-1 text-sm text-white/75">نطابق طلبات الباحثين مع عقارات المعلنين وفق معايير واضحة وقابلة للتخصيص.</p>
          </div>
        </div>
      </section>

      <nav aria-label="نوع الخدمة العقارية" className="grid grid-cols-2 gap-2 rounded-3xl border border-border/60 bg-card p-2 shadow-card">
        <button type="button" onClick={() => setMode("seeker")} className={`flex h-12 items-center justify-center gap-2 rounded-2xl text-sm font-black transition-colors ${mode === "seeker" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"}`}><Search className="h-4 w-4" /> أنا أبحث عن عقار</button>
        <button type="button" onClick={() => setMode("advertiser")} className={`flex h-12 items-center justify-center gap-2 rounded-2xl text-sm font-black transition-colors ${mode === "advertiser" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"}`}><Building2 className="h-4 w-4" /> أنا أعرض عقار</button>
      </nav>

      {mode === "seeker" ? <BuyerRequestPanel /> : <AdvertiserPanel />}

      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground"><BadgeCheck className="h-4 w-4 text-emerald-600" /> لا تظهر بيانات التواصل إلا ضمن طلبات متطابقة ومصرّح بالتواصل معها.</div>
      <Link to="/" className="mx-auto flex w-fit items-center gap-1 text-sm font-bold text-primary"><ChevronLeft className="h-4 w-4" /> العودة للرئيسية</Link>
    </main>
  );
}
