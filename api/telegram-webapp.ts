/* Vercel Serverless Function: same-origin proxy to Solar WebApp APIs (avoids CORS in Telegram webviews). */

const BACKEND_BASE = (process.env.BACKEND_BASE_URL || 'https://solar.api.cognilabs.org').replace(
  /\/+$/,
  ''
);

const readBody = async (req: any): Promise<Buffer | null> => {
  if (req.method === 'GET' || req.method === 'HEAD') return null;
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  return Buffer.concat(chunks);
};

export default async function handler(req: any, res: any) {
  const url = new URL(req.url || '', 'http://localhost');
  const path = (url.searchParams.get('path') || '').replace(/^\/+/, '');
  const upstreamPath = path ? `/${path}` : '/';
  const isSubsidyCalculator = upstreamPath === '/common/public/subsidy-calculator/';
  const upstreamUrl = new URL(
    isSubsidyCalculator
      ? '/api/common/public/subsidy-calculator/'
      : `/api/integrations/telegram/webapp${upstreamPath}`,
    BACKEND_BASE
  );

  // Preserve original query string except internal `path`.
  url.searchParams.delete('path');
  const qs = url.searchParams.toString();
  if (qs) upstreamUrl.search = qs;

  const initDataFromHeader = req.headers['x-telegram-init-data'] || '';
  const authHeader = req.headers['authorization'] || '';
  const initDataFromAuth = String(authHeader).toLowerCase().startsWith('tma ')
    ? String(authHeader).slice(4)
    : '';
  const initData = String(initDataFromHeader || initDataFromAuth || '');

  const headers: Record<string, string> = {};
  const contentType = req.headers['content-type'];
  if (contentType) headers['Content-Type'] = String(contentType);
  if (initData) {
    // Backend schema expects this header; avoid sending Authorization to prevent auth-middleware confusion.
    headers['X-Telegram-Init-Data'] = initData.trim();
  }

  const body = await readBody(req);

  let upstreamResp: Response;
  try {
    upstreamResp = await fetch(upstreamUrl.toString(), {
      method: req.method || 'GET',
      headers,
      body: body ?? undefined,
    });
  } catch (err: any) {
    res.statusCode = 502;
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify({
        status: 'error',
        message: err instanceof Error ? err.message : String(err),
      })
    );
    return;
  }

  const text = await upstreamResp.text();
  res.statusCode = upstreamResp.status;
  res.setHeader('Content-Type', upstreamResp.headers.get('content-type') || 'application/json');
  res.end(text);
}
