const supabase = require('./supabaseClient');

async function fetchRequests() {
    const { data, error } = await supabase
        .from('real_estate_requests')
        .select('*')
        .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
}

async function matchListings(request) {
    let query = supabase
        .from('real_estate_listings')
        .select('*')
        .eq('status', 'متاح')
        .eq('city', request.city);
    if (request.listing_type) {
        query = query.eq('listing_type', request.listing_type);
    }
    if (request.rooms) {
        query = query.gte('rooms', request.rooms - 1).lte('rooms', request.rooms + 1);
    }
    if (request.area) {
        query = query.gte('area', request.area * 0.8).lte('area', request.area * 1.2);
    }
    const { data, error } = await query;
    if (error) throw error;
    if (request.price) {
        data.sort((a, b) => Math.abs(a.price - request.price) - Math.abs(b.price - request.price));
    }
    return data;
}

async function handleNewRequest(requestData) {
    try {
        const { data: request, error: insertError } = await supabase
            .from('real_estate_requests')
            .insert([{
                user_id: requestData.user_id || null,
                listing_type: requestData.listing_type,
                property_type: requestData.property_type,
                city: requestData.city,
                district: requestData.district || null,
                price_min: requestData.price_min || null,
                price_max: requestData.price_max || null,
                rooms: requestData.rooms || null,
                area: requestData.area || null,
                details: requestData.details || null,
                status: 'جديد'
            }])
            .select()
            .single();
        if (insertError) throw insertError;
        const matches = await matchListings(requestData);
        let reply = `✅ تم استلام طلبك بنجاح!\n\n`;
        reply += `📋 تفاصيل الطلب:\n`;
        reply += `- النوع: ${requestData.listing_type}\n`;
        reply += `- المدينة: ${requestData.city}\n`;
        if (requestData.district) reply += `- الحي: ${requestData.district}\n`;
        if (requestData.rooms) reply += `- الغرف: ${requestData.rooms}\n`;
        if (requestData.area) reply += `- المساحة: ${requestData.area}م²\n`;
        if (requestData.price_min || requestData.price_max) {
            reply += `- السعر: ${requestData.price_min || '0'} - ${requestData.price_max || '不限'}\n`;
        }
        reply += `\n🔍 تم العثور على ${matches.length} عرض مطابق:\n\n`;
        if (matches.length === 0) {
            reply += `⚠️ لا توجد عروض مطابقة حاليًا. سنخبرك عند توفر عروض جديدة.`;
        } else {
            matches.slice(0, 5).forEach((listing, index) => {
                reply += `${index + 1}. ${listing.title}\n`;
                reply += `   📍 ${listing.city} - ${listing.district}\n`;
                reply += `   💰 ${listing.price.toLocaleString()} ريال\n`;
                reply += `   🏠 ${listing.rooms} غرف | ${listing.area}م²\n`;
                reply += `   📝 ${listing.details || 'لا يوجد تفاصيل'}\n\n`;
            });
            if (matches.length > 5) {
                reply += `... و ${matches.length - 5} عروض أخرى`;
            }
        }
        return {
            request: request,
            matches: matches,
            reply: reply
        };
    } catch (error) {
        console.error('Error in handleNewRequest:', error);
        throw error;
    }
}

module.exports = {
    fetchRequests,
    matchListings,
    handleNewRequest
};
