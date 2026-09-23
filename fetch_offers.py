import os
import requests

SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

def update_offers_table():
    fresh_offers = [
        {
            "title": "جيتور T2 لاكجري 2027",
            "category": "سيارات",
            "price": "140,000 ر.س",
            "location": "جدة - حي الجوهرة"
        },
        {
            "title": "شقة تمليك جاهزة للإفراغ",
            "category": "عقارات",
            "price": "620,000 ر.س",
            "location": "جدة - حي السلامة"
        }
    ]
    
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates"
    }
    
    url = f"{SUPABASE_URL}/rest/v1/offers"
    
    for offer in fresh_offers:
        response = requests.post(url, json=offer, headers=headers)
        print(f"تم تحديث العرض في جدول offers: {offer['title']} - الحالة: {response.status_code}")

if __name__ == "__main__":
    update_offers_table()
