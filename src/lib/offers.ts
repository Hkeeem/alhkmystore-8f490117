import { supabase } from "@/integrations/supabase/client"

export async function fetchOffers() {
  const sampleOffers = [
    {
      title: "سماعة Anker Soundcore - خصم 60%",
      store_name: "أمازون",
      old_price: 299,
      new_price: 119,
      discount_percent: 60,
      image_url: "https://images.unsplash.com/photo-1546435770-a3e426bf472b",
      affiliate_link: "https://amazon.sa/your-affiliate-link",
      is_hot: true
    }
  ]

  const { error } = await supabase.from("offers").insert(sampleOffers)
  if (error) console.error(error)
  else console.log("Offers added")
}
