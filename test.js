import { handleNewRequest } from './real-estate-agent.js';

const testRequest = {
    listing_type: 'بيع',
    city: 'الرياض',
    district: 'الملقا',
    rooms: 3,
    price: 850000,
    user_id: 'test-user-123'
};

try {
    const result = await handleNewRequest(testRequest);
    console.log('📨 الرد:');
    console.log(result.reply);
} catch (error) {
    console.error('❌ خطأ:', error.message);
}
