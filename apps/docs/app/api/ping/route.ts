// The recommended `pingUrl`: same origin, answers GET and HEAD with 204 and is never cached.
export const dynamic = 'force-dynamic';

const headers = { 'Cache-Control': 'no-store' };

export function GET() {
  return new Response(null, { status: 204, headers });
}

export function HEAD() {
  return new Response(null, { status: 204, headers });
}
