import { randomUUID } from 'node:crypto';

const transactions = new Map<string, { reference: string; amount: number; status: string }>();
const realFetch = globalThis.fetch.bind(globalThis);

globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const url = input instanceof Request ? new URL(input.url) : new URL(input.toString());

  if (url.hostname === 'api.fastlipa.com' && url.pathname === '/v1/transaction/create') {
    const payload = JSON.parse(String(init?.body)) as { number: string; amount: number; reference: string };
    const tranID = `mock-${randomUUID()}`;
    transactions.set(tranID, {
      reference: payload.reference,
      amount: payload.amount,
      status: payload.number === '255612345678'
        ? 'PENDING'
        : payload.number === '255622345678' ? 'CANCELLED' : 'COMPLETED',
    });
    return Response.json({
      status: true,
      message: 'Payment initiated',
      data: { tranID, amount: payload.amount, number: payload.number, payment_status: 'PENDING' },
    });
  }

  if (url.hostname === 'api.fastlipa.com' && url.pathname === '/v1/transaction/status') {
    const tranID = url.searchParams.get('tranid') || '';
    const transaction = transactions.get(tranID);
    if (!transaction) return Response.json({ status: false }, { status: 404 });
    return Response.json({
      status: true,
      message: 'Payment status retrieved',
      data: {
        tranid: tranID,
        payment_status: transaction.status,
        amount: transaction.amount,
        network: 'AIRTEL',
        time: new Date().toISOString(),
      },
    });
  }

  if (url.hostname === 'cdn.test') {
    if (url.pathname.toLowerCase().endsWith('.m3u8')) {
      const manifest = url.pathname.endsWith('playlist.m3u8')
        ? '#EXTM3U\n#EXT-X-STREAM-INF:BANDWIDTH=1000000\n720p/video.m3u8\n'
        : '#EXTM3U\n#EXTINF:4.0,\nvideo0.ts\n#EXT-X-ENDLIST\n';
      return new Response(manifest, { headers: { 'Content-Type': 'application/vnd.apple.mpegurl' } });
    }
    const range = new Headers(init?.headers).get('range');
    return new Response(new Uint8Array([1, 2]), {
      status: range ? 206 : 200,
      headers: {
        'Content-Type': 'video/mp2t',
        'Content-Length': '2',
        ...(range ? { 'Content-Range': 'bytes 0-1/4' } : {}),
        'Accept-Ranges': 'bytes',
      },
    });
  }

  return realFetch(input, init);
};
