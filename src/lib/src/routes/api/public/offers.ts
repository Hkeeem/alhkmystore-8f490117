// alhkmy.app - src/routes/api/public/offers.ts
import { createAPIFileRoute } from '@tanstack/react-start/api';
import { checkApiKey, jsonResponse, errorResponse, handleOptions } from '../../../lib/apiAuth';
import { getOffers } from '../../../lib/dataSource';

export const Route = createAPIFileRoute('/api/public/offers')({
  OPTIONS: async () => handleOptions(),

  GET: async ({ request }) => {
    if (!checkApiKey(request)) {
      return errorResponse('غير مصرح - مفتاح API غير صحيح', 401);
    }

    try {
      const offers = await getOffers();
      return jsonResponse({
        success: true,
        data: offers,
        count: offers.length,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Offers API error:', error);
      return errorResponse('فشل جلب العروض');
    }
  },
});
