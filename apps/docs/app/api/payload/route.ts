// A download for the live demo: `kb` kilobytes of random bytes (default 1024, at most 2048).
// Random data does not compress, so the transfer size is the real size.
export const dynamic = 'force-dynamic';

export function GET(request: Request) {
  const kb = Math.min(Math.max(Number(new URL(request.url).searchParams.get('kb')) || 1024, 1), 2048);
  const bytes = new Uint8Array(kb * 1024);
  for (let offset = 0; offset < bytes.length; offset += 65536) {
    crypto.getRandomValues(bytes.subarray(offset, offset + 65536)); // 65536 is the per-call limit
  }
  return new Response(bytes, {
    headers: { 'Content-Type': 'application/octet-stream', 'Cache-Control': 'no-store' },
  });
}
