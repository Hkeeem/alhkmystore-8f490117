import { useEffect, useState } from "react"
import { getOffers } from "@/lib/offers"

export function OffersSection() {
  const [offers, setOffers] = useState<any[]>([])

  useEffect(() => {
    getOffers().then(setOffers)
  }, [])

  if (offers.length === 0) return null

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">🔥 عروض اليوم</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {offers.map((offer) => (
          <a key={offer.id} href={offer.affiliate_link} target="_blank" className="border rounded-lg p-2">
            <img src={offer.image_url} className="w-full h-32 object-cover rounded" />
            <h3 className="text-sm mt-2 font-bold">{offer.title}</h3>
            <p className="text-xs text-gray-500">{offer.store_name}</p>
            <div className="flex gap-2 mt-1">
              <span className="line-through text-xs">{offer.old_price} ر.س</span>
              <span className="text-red-600 font-bold text-sm">{offer.new_price} ر.س</span>
            </div>
            {offer.discount_percent && (
              <span className="bg-red-600 text-white text-xs px-2 py-1 rounded mt-1 inline-block">
                خصم {offer.discount_percent}%
              </span>
            )}
          </a>
        ))}
      </div>
    </div>
  )
}
