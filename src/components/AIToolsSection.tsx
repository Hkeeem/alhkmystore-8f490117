export function AIToolsSection() {
  const aiProviders = [
    { 
      name: 'ChatGPT', 
      logo: '🤖', 
      color: 'from-emerald-500 to-teal-600',
      role: 'هيكلة وأفكار',
    },
    { 
      name: 'Claude', 
      logo: '🧠', 
      color: 'from-orange-400 to-rose-600',
      role: 'كتابة وتحرير',
    },
    { 
      name: 'Gemini', 
      logo: '✨', 
      color: 'from-blue-500 via-purple-500 to-pink-500',
      role: 'مساعد ذكي',
    },
    { 
      name: 'DeepSeek', 
      logo: '🐋', 
      color: 'from-blue-600 to-indigo-700',
      role: 'تطوير وبرمجة',
    },
    { 
      name: 'Grok', 
      logo: '🚀', 
      color: 'from-gray-800 to-black',
      role: 'تحليل ذكي',
    },
    { 
      name: 'Genspark', 
      logo: '⚡', 
      color: 'from-amber-500 to-yellow-600',
      role: 'بحث شامل',
    },
    { 
      name: 'Manus', 
      logo: '🎯', 
      color: 'from-slate-700 to-slate-900',
      role: 'مهام معقدة',
    },
    { 
      name: 'Meta AI', 
      logo: '🌐', 
      color: 'from-blue-600 to-cyan-500',
      role: 'أفكار إبداعية',
    },
    { 
      name: 'Lovable', 
      logo: '💜', 
      color: 'from-pink-500 to-fuchsia-600',
      role: 'بناء المنصة',
    },
    { 
      name: 'Vercel', 
      logo: '▲', 
      color: 'from-neutral-800 to-black',
      role: 'نشر واستضافة',
    },
  ];

  return (
    <section dir="rtl" className="px-4 py-4 space-y-3">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <h2 className="font-black text-sm md:text-base text-foreground">
            مساعدو الذكاء الاصطناعي المدمجون
          </h2>
          <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">
            {aiProviders.length} أدوات
          </span>
        </div>
        <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          مدعوم بالكامل
        </span>
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-4 md:grid-cols-5 gap-2">
        {aiProviders.map((provider, idx) => (
          <div
            key={idx}
            className="bg-card border border-border/60 rounded-2xl p-2.5 flex flex-col items-center justify-center text-center hover:shadow-md hover:border-primary/40 transition-all cursor-pointer group active:scale-95"
          >
            <div
              className={`w-9 h-9 rounded-xl bg-gradient-to-br ${provider.color} flex items-center justify-center text-base shadow-sm group-hover:scale-110 transition-transform`}
            >
              {provider.logo}
            </div>
            <span className="text-[10px] md:text-[11px] font-bold mt-1.5 text-foreground leading-tight">
              {provider.name}
            </span>
            <span className="text-[8px] md:text-[9px] text-muted-foreground leading-tight mt-0.5">
              {provider.role}
            </span>
          </div>
        ))}
      </div>

      {/* Story Card */}
      <div className="relative bg-gradient-to-br from-primary/10 via-card to-card border border-primary/20 rounded-2xl p-4 overflow-hidden">
        <div className="absolute -top-8 -left-8 w-32 h-32 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="relative flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-lg shrink-0 shadow-md">
            ⚡
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-black text-xs md:text-sm text-foreground mb-1">
              قصة البناء في 60 يوماً
            </h3>
            <p className="text-[10px] md:text-[11px] text-muted-foreground leading-relaxed">
              في <span className="font-bold text-primary">60 يوماً فقط</span>، وبميزانية لا تتجاوز{' '}
              <span className="font-bold text-primary">100 دولار</span>، وبالاستعانة بنخبة من أذكى نماذج الذكاء الاصطناعي، أطلقنا{' '}
              <span className="font-bold text-foreground">HkeeemAI</span> — منصة ذكية لمقارنة الأسعار والعروض في السعودية.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
