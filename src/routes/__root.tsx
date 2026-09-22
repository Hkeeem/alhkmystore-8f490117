head: () => ({
  meta: [
    { charSet: "utf-8" },
    { name: "viewport", content: "width=device-width, initial-scale=1" },
    { title: "HkeeemAI — تسوّق أذكى… وفّر أكثر" },
    {
      name: "description",
      content:
        "HkeeemAI — منصة سعودية ذكية تجمع أفضل العروض والكوبونات ومقارنة الأسعار والعقارات والسيارات والخرائط في مكان واحد، مدعومة بالذكاء الاصطناعي.",
    },
    { name: "theme-color", content: "#D4AF37" },
    { property: "og:title", content: "HkeeemAI — تسوّق أذكى… وفّر أكثر" },
    {
      property: "og:description",
      content: "الذكاء الاقتصادي للمملكة: قرارات شراء أذكى في دقائق.",
    },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
    {
      name: "google-site-verification",
      content: "AC4RPtk9MfT0OS3OiEocjDzCHnXq8gZ2ujMtswOKir4",
    },
    {
      name: "mitgo-verification",
      content: "cecd2881-09c1-43cd-b8bb-156963232a2f",
    },
  ],
  links: [
    { rel: "stylesheet", href: appCss },
    { rel: "icon", href: "/favicon.png", type: "image/png" },
    { rel: "apple-touch-icon", href: "/hkeeem_192.png" },
    { rel: "manifest", href: "/manifest.webmanifest" },
  ],
  scripts: [
    {
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "Organization",
            name: "حكيم AI",
            url: "https://alhkmystore.lovable.app/",
            logo: "https://alhkmystore.lovable.app/hkeeem_512.png",
          },
          {
            "@type": "WebSite",
            name: "حكيم AI",
            url: "https://alhkmystore.lovable.app/",
            inLanguage: "ar",
            potentialAction: {
              "@type": "SearchAction",
              target: "https://alhkmystore.lovable.app/chat?q={search_term_string}",
              "query-input": "required name=search_term_string",
            },
          },
        ],
      }),
    },
  ],
}),
