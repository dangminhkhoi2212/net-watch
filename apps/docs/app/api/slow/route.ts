// A slow endpoint for the live demo: answers 204 after `ms` milliseconds (default 1500, at most 5000).
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const ms = Math.min(Math.max(Number(new URL(request.url).searchParams.get('ms')) || 1500, 0), 5000);
  await new Promise((resolve) => setTimeout(resolve, ms));
  return new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } });
}
