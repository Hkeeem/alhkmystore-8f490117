export function OffersSection() {
  const offers = [
    {
      id: 1,
      title: "آيفون 15 برو ماكس 256 جيجا - تيتانيوم",
      image_url: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=500",
      affiliate_link: "https://www.amazon.sa/s?k=iphone+15&tag=alhkmy-21",
      store_name: "أمازون السعودية",
      old_price: 5299,
      new_price: 4499,
      discount: 15,
    },
    {
      id: 2,
      title: "قلاية هوائية 5.5 لتر - خصم نون الكبير",
      image_url: "https://images.unsplash.com/photo-1585237672814-8c0a6a389f3f?w=500",
      affiliate_link: "https://www.noon.com/saudi-ar/search?q=air+fryer",
      store_name: "نون",
      old_price: 399,
      new_price: 199,
      discount: 50,
    },
    {
      id: 3,
      title: "ساعة هواوي GT4 الذكية",
      image_url: "https://images.unsplash.com/photo-1508685092959-98d09943f6f1?w=500",
      affiliate_link: "https://www.amazon.sa/s?k=huawei+watch&tag=alhkmy-21",
      store_name: "أمازون",
      old_price: 899,
      new_price: 649,
      discount: 28,
    },
    {
      id: 4,
      title: "عطر دخون العود الملكي",
      image_url: "https://images.unsplash.com/photo-1594035910387-fea47794261f?w=500",
      affiliate_link: "https://www.noon.com/saudi-ar/search?q=perfume",
      store_name: "نون",
      old_price: 250,
      new_price: 129,
      discount: 48,
    },
  ];

  return (
    <section>
      <h2 className="font-black text-2xl md:text-3xl mb-4">🔥 عروض اليوم - حية</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {offers.map((offer) => (
          <a
            key={offer.id}
            href={offer.affiliate_link}
            target="_blank"
            rel="noopener"
            className="bg-card rounded-3xl border border-border/60 p-3 hover:shadow-glow transition"
          >
            <img src={offer.image_url} className="w-full h-32 object-cover rounded-2xl" />
            <h3 className="text-sm font-bold mt-2 line-clamp-2">{offer.title}</h3>
            <p className="text-xs text-muted-foreground">{offer.store_name}</p>
            <div className="flex gap-2 mt-2 items-center">
              <span className="line-through text-xs">{offer.old_price} ر.س</span>
              <span className="text-red-600 font-black text-sm">{offer.new_price} ر.س</span>
            </div>
            <span className="bg-red-600 text-white text-[10px] px-2 py-1 rounded-full mt-2 inline-block">
              خصم {offer.discount}%
            </span>
          </a>
        ))}
      </div>
    </section>
  );
}
