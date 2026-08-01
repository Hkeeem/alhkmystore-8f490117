import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Home, Search, SlidersHorizontal, MapPin, Sparkles,
  CheckCircle2, XCircle, ChevronDown, ChevronUp,
  Phone, MessageCircle, Star, Building2, ArrowRight,
  BedDouble, Bath, Maximize2, Calendar, Wrench
} from "lucide-react";
import {
  findMatches, DISTRICTS_JEDDAH, SERVICES_LIST, FEATURES_LIST,
  type PropertyRequest, type MatchResult, type PropertyType, type FinishType,
} from "@/data/real-estate-listings";
import { RealEstatePageSkeleton } from "@/components/Skeletons";

export const Route = createFileRoute("/real-estate")({
  head: () => ({
    meta: [
      { title: "البحث العقاري الذكي — HkeeemAI" },
      { name: "description", content: "ابحث عن عقارك المثالي بالذكاء الاصطناعي — نطابق طلبك مع أفضل العروض بنسب دقيقة." },
    ],
  }),
  pendingComponent: RealEstatePageSkeleton,
  pendingMs: 0,
  pendingMinMs: 300,
  component: RealEstate,
});

const PROPERTY_TYPES: PropertyType[] = ["شقة", "فيلا", "دوبلكس", "أرض", "استوديو", "مكتب"];
const FINISH_TYPES: FinishType[] = ["سوبر لوكس", "لوكس", "عادي", "نظام"];

function ScoreRing({ score }: { score: number }) {
  const color = score >= 90 ? "#22c55e" : score >= 75 ? "#f59e0b" : "#ef4444";
  const r = 28;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <div className="relative w-16 h-16 shrink-0">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 72 72">
        <circle cx="36" cy="36" r={r} fill="none" stroke="hsl(var(--border))" strokeWidth="6" />
        <circle
          cx="36" cy="36" r={r} fill="none"
          stroke={color} strokeWidth="6"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.8s ease" }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-black text-sm" style={{ color }}>
        {score}%
      </span>
    </div>
  );
}

function MatchCard({ result, rank }: { result: MatchResult; rank: number }) {
  const [expanded, setExpanded] = useState(false);
  const { listing, score, breakdown } = result;
  const isTop = score >= 90;

  return (
    <article className={`rounded-3xl border overflow-hidden shadow-card transition-all ${isTop ? "border-green-500/40 bg-green-500/5" : "border-border/60 bg-card"}`}>
      {/* صورة العقار */}
      <div className="relative h-44 overflow-hidden">
        <img
          src={listing.image}
          alt={listing.title}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover"
          onError={e => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800"; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        {/* الترتيب */}
        <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 backdrop-blur flex items-center justify-center text-white font-black text-sm">
          {rank}
        </div>
        {/* شارة التطابق العالي */}
        {isTop && (
          <div className="absolute top-3 left-3 flex items-center gap-1 px-2 py-1 rounded-full bg-green-500 text-white text-xs font-bold">
            <Star className="w-3 h-3 fill-white" /> تطابق ممتاز
          </div>
        )}
        {/* الغرض */}
        <div className={`absolute bottom-3 right-3 px-2 py-1 rounded-full text-xs font-bold ${listing.purpose === "بيع" ? "bg-primary text-primary-foreground" : "bg-blue-600 text-white"}`}>
          {listing.purpose}
        </div>
        <div className="absolute bottom-3 left-3 text-white font-black text-lg">
          {listing.price.toLocaleString("ar-SA")} ر.س
          {listing.purpose === "إيجار" && <span className="text-xs font-normal">/سنة</span>}
        </div>
      </div>

      <div className="p-4 space-y-3">
        {/* العنوان والنسبة */}
        <div className="flex items-start gap-3">
          <ScoreRing score={score} />
          <div className="flex-1 min-w-0">
            <h3 className="font-black text-base leading-tight">{listing.title}</h3>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <MapPin className="w-3 h-3" />
              <span>حي {listing.district}، {listing.city}</span>
            </div>
            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
              {listing.rooms > 0 && <span className="flex items-center gap-1"><BedDouble className="w-3 h-3" />{listing.rooms} غرف</span>}
              {listing.bathrooms > 0 && <span className="flex items-center gap-1"><Bath className="w-3 h-3" />{listing.bathrooms} حمام</span>}
              <span className="flex items-center gap-1"><Maximize2 className="w-3 h-3" />{listing.area} م²</span>
              <span className="flex items-center gap-1"><Wrench className="w-3 h-3" />{listing.finish}</span>
            </div>
          </div>
        </div>

        {/* شريط التطابق */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">نسبة التطابق</span>
            <span className={`font-bold ${score >= 90 ? "text-green-500" : score >= 75 ? "text-amber-500" : "text-red-500"}`}>{score}%</span>
          </div>
          <div className="h-2 rounded-full bg-border overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${score >= 90 ? "bg-green-500" : score >= 75 ? "bg-amber-500" : "bg-red-500"}`}
              style={{ width: `${score}%` }}
            />
          </div>
        </div>

        {/* تفاصيل التطابق */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between text-xs text-primary font-bold py-1"
        >
          <span>تفاصيل التطابق</span>
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {expanded && (
          <div className="space-y-2 border-t border-border/40 pt-2">
            {breakdown.map(item => (
              <div key={item.label} className="flex items-center gap-2 text-xs">
                {item.score >= 80
                  ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
                  : <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                }
                <span className="font-bold w-16 shrink-0">{item.label}</span>
                <span className="text-muted-foreground flex-1">{item.detail}</span>
                <span className={`font-black shrink-0 ${item.score >= 80 ? "text-green-500" : "text-red-400"}`}>{item.score}%</span>
              </div>
            ))}
          </div>
        )}

        {/* أزرار التواصل */}
        <div className="flex gap-2 pt-1">
          <a
            href={`tel:${listing.phone}`}
            className="flex-1 flex items-center justify-center gap-1.5 h-10 rounded-2xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90"
          >
            <Phone className="w-4 h-4" />
            اتصال
          </a>
          <a
            href={`https://wa.me/966${listing.phone.slice(1)}?text=${encodeURIComponent(`السلام عليكم، رأيت عرض "${listing.title}" في تطبيق HkeeemAI وأريد الاستفسار عنه.`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1.5 h-10 rounded-2xl bg-green-600 text-white text-sm font-bold hover:bg-green-700"
          >
            <MessageCircle className="w-4 h-4" />
            واتساب
          </a>
        </div>
      </div>
    </article>
  );
}

function RealEstate() {
  const [step, setStep] = useState<"form" | "results">("form");
  const [results, setResults] = useState<MatchResult[]>([]);
  const [loading, setLoading] = useState(false);

  // حقول النموذج
  const [purpose, setPurpose] = useState<"بيع" | "إيجار">("بيع");
  const [propertyType, setPropertyType] = useState<PropertyType | "">("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minArea, setMinArea] = useState("");
  const [maxArea, setMaxArea] = useState("");
  const [rooms, setRooms] = useState("2");
  const [district, setDistrict] = useState("");
  const [finish, setFinish] = useState<FinishType | "">("");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);

  const toggleService = (s: string) =>
    setSelectedServices(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);

  const toggleFeature = (f: string) =>
    setSelectedFeatures(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]);

  const handleSearch = () => {
    setLoading(true);
    const request: PropertyRequest = {
      purpose,
      type: propertyType || undefined,
      minPrice: Number(minPrice) || 0,
      maxPrice: Number(maxPrice) || 99_999_999,
      minArea: Number(minArea) || 0,
      maxArea: Number(maxArea) || 99_999,
      rooms: Number(rooms) || 1,
      district: district || undefined,
      city: "جدة",
      finish: finish || undefined,
      requiredServices: selectedServices,
      requiredFeatures: selectedFeatures,
    };
    setTimeout(() => {
      const matches = findMatches(request);
      setResults(matches);
      setStep("results");
      setLoading(false);
    }, 800);
  };

  return (
    <main className="max-w-2xl mx-auto px-4 pt-6 pb-20 space-y-6">
      {/* هيدر */}
      <section className="relative overflow-hidden rounded-[2rem] bg-gradient-hero p-6 text-primary-foreground shadow-glow">
        <div className="absolute -top-16 -left-10 w-48 h-48 rounded-full bg-primary/20 blur-3xl" />
        <div className="relative flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 text-xs font-bold mb-2">
              <Sparkles className="w-3 h-3" /> ذكاء اصطناعي
            </div>
            <h1 className="font-display text-2xl font-black">البحث العقاري الذكي</h1>
            <p className="text-white/75 text-sm mt-1">أدخل متطلباتك ونطابقها مع أفضل العروض بنسب دقيقة</p>
          </div>
        </div>
      </section>

      {step === "form" ? (
        <div className="space-y-5">
          {/* الغرض */}
          <div className="p-5 rounded-3xl bg-card border border-border/60 shadow-card space-y-3">
            <h2 className="font-black text-base flex items-center gap-2"><Home className="w-4 h-4 text-primary" /> الغرض من العقار</h2>
            <div className="grid grid-cols-2 gap-3">
              {(["بيع", "إيجار"] as const).map(p => (
                <button
                  key={p}
                  onClick={() => setPurpose(p)}
                  className={`h-12 rounded-2xl font-bold text-sm transition-all ${purpose === p ? "bg-primary text-primary-foreground shadow-glow" : "bg-secondary text-foreground"}`}
                >
                  {p === "بيع" ? "🏠 شراء" : "🔑 إيجار"}
                </button>
              ))}
            </div>
          </div>

          {/* نوع العقار */}
          <div className="p-5 rounded-3xl bg-card border border-border/60 shadow-card space-y-3">
            <h2 className="font-black text-base flex items-center gap-2"><Building2 className="w-4 h-4 text-primary" /> نوع العقار</h2>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setPropertyType("")}
                className={`px-3 py-1.5 rounded-xl text-sm font-bold transition-all ${!propertyType ? "bg-primary text-primary-foreground" : "bg-secondary"}`}
              >
                الكل
              </button>
              {PROPERTY_TYPES.map(t => (
                <button
                  key={t}
                  onClick={() => setPropertyType(t)}
                  className={`px-3 py-1.5 rounded-xl text-sm font-bold transition-all ${propertyType === t ? "bg-primary text-primary-foreground" : "bg-secondary"}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* الميزانية */}
          <div className="p-5 rounded-3xl bg-card border border-border/60 shadow-card space-y-3">
            <h2 className="font-black text-base flex items-center gap-2">
              💰 الميزانية (ر.س)
              {purpose === "إيجار" && <span className="text-xs text-muted-foreground font-normal">سنوياً</span>}
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">الحد الأدنى</label>
                <input
                  type="number"
                  value={minPrice}
                  onChange={e => setMinPrice(e.target.value)}
                  placeholder={purpose === "بيع" ? "500,000" : "20,000"}
                  className="w-full h-11 px-3 rounded-2xl bg-secondary border border-border/60 text-sm font-bold text-right"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">الحد الأقصى</label>
                <input
                  type="number"
                  value={maxPrice}
                  onChange={e => setMaxPrice(e.target.value)}
                  placeholder={purpose === "بيع" ? "2,000,000" : "80,000"}
                  className="w-full h-11 px-3 rounded-2xl bg-secondary border border-border/60 text-sm font-bold text-right"
                />
              </div>
            </div>
          </div>

          {/* المساحة والغرف */}
          <div className="p-5 rounded-3xl bg-card border border-border/60 shadow-card space-y-3">
            <h2 className="font-black text-base flex items-center gap-2"><Maximize2 className="w-4 h-4 text-primary" /> المساحة والغرف</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">المساحة من (م²)</label>
                <input
                  type="number"
                  value={minArea}
                  onChange={e => setMinArea(e.target.value)}
                  placeholder="100"
                  className="w-full h-11 px-3 rounded-2xl bg-secondary border border-border/60 text-sm font-bold text-right"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">المساحة إلى (م²)</label>
                <input
                  type="number"
                  value={maxArea}
                  onChange={e => setMaxArea(e.target.value)}
                  placeholder="500"
                  className="w-full h-11 px-3 rounded-2xl bg-secondary border border-border/60 text-sm font-bold text-right"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-2 block">عدد الغرف (الحد الأدنى)</label>
              <div className="flex gap-2 flex-wrap">
                {["1", "2", "3", "4", "5", "6+"].map(r => (
                  <button
                    key={r}
                    onClick={() => setRooms(r === "6+" ? "6" : r)}
                    className={`w-11 h-11 rounded-2xl font-bold text-sm transition-all ${rooms === (r === "6+" ? "6" : r) ? "bg-primary text-primary-foreground" : "bg-secondary"}`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* الموقع */}
          <div className="p-5 rounded-3xl bg-card border border-border/60 shadow-card space-y-3">
            <h2 className="font-black text-base flex items-center gap-2"><MapPin className="w-4 h-4 text-primary" /> الموقع المفضل</h2>
            <select
              value={district}
              onChange={e => setDistrict(e.target.value)}
              className="w-full h-11 px-3 rounded-2xl bg-secondary border border-border/60 text-sm font-bold text-right"
            >
              <option value="">أي حي في جدة</option>
              {DISTRICTS_JEDDAH.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* التشطيب */}
          <div className="p-5 rounded-3xl bg-card border border-border/60 shadow-card space-y-3">
            <h2 className="font-black text-base flex items-center gap-2"><Wrench className="w-4 h-4 text-primary" /> مستوى التشطيب</h2>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFinish("")}
                className={`px-3 py-1.5 rounded-xl text-sm font-bold transition-all ${!finish ? "bg-primary text-primary-foreground" : "bg-secondary"}`}
              >
                أي تشطيب
              </button>
              {FINISH_TYPES.map(f => (
                <button
                  key={f}
                  onClick={() => setFinish(f)}
                  className={`px-3 py-1.5 rounded-xl text-sm font-bold transition-all ${finish === f ? "bg-primary text-primary-foreground" : "bg-secondary"}`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* الخدمات المطلوبة */}
          <div className="p-5 rounded-3xl bg-card border border-border/60 shadow-card space-y-3">
            <h2 className="font-black text-base flex items-center gap-2"><SlidersHorizontal className="w-4 h-4 text-primary" /> الخدمات المطلوبة</h2>
            <div className="flex flex-wrap gap-2">
              {SERVICES_LIST.map(s => (
                <button
                  key={s}
                  onClick={() => toggleService(s)}
                  className={`px-3 py-1.5 rounded-xl text-sm font-bold transition-all ${selectedServices.includes(s) ? "bg-primary text-primary-foreground" : "bg-secondary"}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* المميزات المطلوبة */}
          <div className="p-5 rounded-3xl bg-card border border-border/60 shadow-card space-y-3">
            <h2 className="font-black text-base flex items-center gap-2">✨ المميزات المطلوبة</h2>
            <div className="flex flex-wrap gap-2">
              {FEATURES_LIST.map(f => (
                <button
                  key={f}
                  onClick={() => toggleFeature(f)}
                  className={`px-3 py-1.5 rounded-xl text-sm font-bold transition-all ${selectedFeatures.includes(f) ? "bg-primary text-primary-foreground" : "bg-secondary"}`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* زر البحث */}
          <button
            onClick={handleSearch}
            disabled={loading}
            className="w-full h-14 rounded-3xl bg-gradient-gold text-secondary-foreground font-black text-lg shadow-glow flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-60"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                جاري التحليل...
              </>
            ) : (
              <>
                <Search className="w-5 h-5" />
                ابحث عن أفضل تطابق
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* رأس النتائج */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-black text-xl">نتائج البحث</h2>
              <p className="text-sm text-muted-foreground">
                {results.length > 0
                  ? `${results.length} عرض متطابق — أعلى نسبة: ${results[0]?.score}%`
                  : "لم يُعثر على عروض مطابقة"}
              </p>
            </div>
            <button
              onClick={() => setStep("form")}
              className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-secondary text-sm font-bold"
            >
              <ArrowRight className="w-4 h-4" />
              تعديل البحث
            </button>
          </div>

          {results.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto">
                <Search className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="font-bold text-muted-foreground">لا توجد عروض تطابق معاييرك حالياً</p>
              <p className="text-sm text-muted-foreground">جرّب توسيع نطاق السعر أو المساحة</p>
            </div>
          ) : (
            <>
              {/* ملخص سريع */}
              {results[0]?.score >= 90 && (
                <div className="p-4 rounded-2xl bg-green-500/10 border border-green-500/30 flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                  <p className="text-sm font-bold text-green-700 dark:text-green-400">
                    وجدنا {results.filter(r => r.score >= 90).length} عرض بتطابق ممتاز 90%+ مع طلبك!
                  </p>
                </div>
              )}

              {/* بطاقات النتائج */}
              <div className="space-y-4">
                {results.map((result, i) => (
                  <MatchCard key={result.listing.id} result={result} rank={i + 1} />
                ))}
              </div>

              {/* تواصل مع المكتب */}
              <div className="p-5 rounded-3xl bg-gradient-hero text-primary-foreground shadow-glow space-y-3">
                <h3 className="font-black text-base">هل تريد مساعدة متخصصة؟</h3>
                <p className="text-white/75 text-sm">فريق مؤسسة محسن لخدمات الأعمال جاهز لمساعدتك في إيجاد عقارك المثالي</p>
                <a
                  href="https://wa.me/966500000000"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 h-11 rounded-2xl bg-white/15 backdrop-blur font-bold text-sm hover:bg-white/25 transition-all"
                >
                  <MessageCircle className="w-4 h-4" />
                  تواصل مع المكتب العقاري
                </a>
              </div>
            </>
          )}
        </div>
      )}
    </main>
  );
}
