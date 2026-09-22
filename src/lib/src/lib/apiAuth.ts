// alhkmy.app - src/lib/apiAuth.ts

const PUBLIC_API_SECRET = process.env.PUBLIC_API_SECRET;
const CRON_SECRET = process.env.CRON_SECRET;

export const CORS_HEADERS = {
  'access-control-allow-origin': 'https://alhkmy.store,https://www.alhkmy.store',
  'access-control-allow-methods': 'GET, POST, OPTIONS',
  'access-control-allow-headers': 'content-type, x-api-key, x-cron-secret',
  'access-control-max-age': '86400',
};

export function checkApiKey(request: Request): boolean {
  const key = request.headers.get('x-api-key');
  return key === PUBLIC_API_SECRET;
}

export function checkCronSecret(request: Request): boolean {
  const key = request.headers.get('x-cron-secret');
  return key === CRON_SECRET;
}

export function jsonResponse(data: any, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json',
      ...CORS_HEADERS,
    },
  });
}

export function errorResponse(message: string, status = 500): Response {
  return jsonResponse({ success: false, error: message }, status);
}

// معالجة طلبات OPTIONS (Preflight)
export function handleOptions(): Response {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}
