'use client';

export default function RealEstateSection() {
  return (
    <div className="mt-12 px-4">
      <div className="bg-gradient-to-br from-zinc-900 to-black rounded-3xl p-8 border border-yellow-400/20">
        <div className="flex items-center gap-3 mb-6">
          <div className="text-4xl">🏠</div>
          <div>
            <h2 className="text-3xl font-bold">خدماتنا العقارية</h2>
            <p className="text-yellow-400">بيع • شراء • إيجار • استثمار</p>
          </div>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6 mb-10">
          <div className="bg-zinc-900/80 rounded-2xl p-6 border border-yellow-400/10">
            <h3 className="font-semibold text-xl mb-3">تقييم عقاري ذكي</h3>
            <p className="text-zinc-400 text-sm">احصل على تقييم فوري ودقيق لعقارك باستخدام الذكاء الاصطناعي</p>
          </div>
          
          <div className="bg-zinc-900/80 rounded-2xl p-6 border border-yellow-400/10">
            <h3 className="font-semibold text-xl mb-3">عروض استثمارية</h3>
            <p className="text-zinc-400 text-sm">اكتشف أفضل الفرص الاستثمارية في الرياض والمدن الرئيسية</p>
          </div>
        </div>

        {/* مكتب محسن للخدمات العقارية */}
        <div className="text-center border-t border-yellow-400/20 pt-8">
          <p className="text-zinc-400 mb-4 text-sm">يسعدني استقبال طلباتكم وعروضكم</p>
          
          <a 
            href="https://dealapp.sa/ar/profile/67c08063ca5bafdb59e3d8d4?utm_source=visit_my_profile"
            target="_blank"
            className="inline-flex items-center gap-3 bg-gradient-to-r from-yellow-400 to-amber-500 text-black font-semibold px-10 py-4 rounded-2xl hover:brightness-110 transition-all active:scale-95"
          >
            <span>زيارة مكتبي العقاري</span>
            <span className="text-xl">→</span>
          </a>
          
          <p className="text-xs text-zinc-500 mt-4">(مؤسسة محسن لخدمات الأعمال)</p>
        </div>
      </div>
    </div>
  );
}
