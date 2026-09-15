export function AIToolsSection() {
  const aiProviders = [
    { name: 'Gemini', logo: '✨', color: 'from-blue-500 to-indigo-500' },
    { name: 'ChatGPT', logo: '🤖', color: 'from-emerald-500 to-teal-600' },
    { name: 'Claude', logo: '🧠', color: 'from-amber-500 to-orange-600' },
    { name: 'Meta AI', logo: '🌐', color: 'from-blue-600 to-cyan-500' },
    { name: 'Manus', logo: '⚡', color: 'from-purple-500 to-pink-500' },
    { name: 'Grok', logo: '🚀', color: 'from-gray-800 to-black text-white' },
  ];

  return (
    <section dir="rtl" className="px-4 py-3 space-y-3">
      <div className="flex justify-between items-center">
        <h2 className="font-black text-sm md:text-base text-foreground">مساعدو الذكاء الاصطناعي المدمجون</h2>
        <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">مدعوم بالكامل</span>
      </div>

      <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
        {aiProviders.map((provider, idx) => (
          <div
            key={idx}
            className="bg-card border border-border/60 rounded-2xl p-2.5 flex flex-col items-center justify-center text-center hover:shadow-md transition cursor-pointer group"
          >
            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${provider.color} flex items-center justify-center text-base shadow-sm group-hover:scale-110 transition-transform`}>
              {provider.logo}
            </div>
            <span className="text-[11px] font-bold mt-1.5 text-foreground">{provider.name}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
