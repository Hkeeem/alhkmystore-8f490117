import { supabase } from "@/integrations/supabase/client"

export type Offer = {
  id?: string
  title: string
  store_name: string
  old_price: number
  new_price: number
  discount_percent: number
  image_url: string
  affiliate_link: string
  is_hot?: boolean
}

export async function getOffers() {
  const { data, error } = await supabase
    .from("offers")
    .select("*")
    .order("created_at", { ascending: false })
  
  if (error) {
    console.error(error)
    return []
  }
  return data
}

export async function addSampleOffers() {
  const offers: Offer[] = [
    {
      title: "سماعة Anker Soundcore Life P3 - خصم 60%",
      store_name: "أمازون السعودية",
      old_price: 299,
      new_price: 119,
      discount_percent: 60,
      image_url: "https://images.unsplash.com/photo-1546435770-a3e426bf472b",
      affiliate_link: "https://amazon.sa/dp/B08M5FW4T4?tag=alhkmy-21",
      is_hot: true
    },
    {
      title: "ساعة شاومي Mi Band 8",
      store_name: "نون",
      old_price: 199,
      new_price: 129,
      discount_percent: 35,
      image_url: "https://images.unsplash.com/photo-1579586337278-3befd40fd17a",
      affiliate_link: "https://noon.com/your-link",
      is_hot: false
    }
  ]

  const { error } = await supabase.from("offers").insert(offers)
  if (error) console.log("Error:", error)
  else console.log("Offers added successfully")
}
