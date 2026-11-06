import { randomUUID } from 'node:crypto';

const transactions = new Map<string, {
  transactionId: string;
  orderId: string;
  amount: number;
  status: string;
}>();
const realFetch = globalThis.fetch.bind(globalThis);

globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const url = input instanceof Request ? new URL(input.url) : new URL(input.toString());

  if (
    url.hostname === 'palmpesa.drmlelwa.co.tz' &&
    url.pathname === '/api/palmpesa/initiate' &&
    init?.method === 'POST'
  ) {
    const payload = JSON.parse(String(init.body)) as {
      transaction_id: string;
      phone: string;
      amount: number;
      callback_url: string;
      email: string;
      name: string;
      address: string;
      postcode: string;
    };
    const headers = new Headers(init.headers);
    if (
      headers.get('authorization') !== 'Bearer test-provider-token' ||
      payload.callback_url !== 'https://wakubwa.chombezo.online/api/webhook/palmpesa' ||
      payload.email !== 'daviskavenuke@gmail.com' ||
      payload.name !== 'Juma Hassan Shaibu' ||
      !/^0[67]\d{8}$/.test(payload.phone) ||
      payload.amount !== 1500 ||
      !payload.transaction_id.startsWith('tx-') ||
      payload.address !== 'Dar es Salaam' ||
      payload.postcode !== '00000'
    ) {
      return Response.json({ success: false, message: 'PalmPesa defaults do not match.' }, { status: 422 });
    }
    if (payload.phone === '0699999999') {
      return Response.json({
        success: false,
        code: 'TEST_REJECTED',
        message: 'Test payment rejection.',
      }, { status: 422 });
    }
    const orderId = `mock-${randomUUID()}`;
    const status = payload.phone === '0612345678'
      ? 'PENDING_API_CHECK'
      : payload.phone === '0622345678' ? 'CANCELLED'
        : payload.phone === '0692345678' ? 'REJECTED'
          : payload.phone === '0688888888' ? 'NOT_FOUND' : 'COMPLETED';
    const transaction = {
      transactionId: payload.transaction_id,
      orderId,
      amount: payload.amount,
      status,
    };
    transactions.set(orderId, transaction);
    return Response.json({
      order_id: orderId,
    });
  }

  if (
    url.hostname === 'palmpesa.drmlelwa.co.tz' &&
    url.pathname === '/api/order-status' &&
    init?.method === 'POST'
  ) {
    const payload = JSON.parse(String(init.body)) as { order_id: string };
    const headers = new Headers(init.headers);
    if (headers.get('authorization') !== 'Bearer test-provider-token') {
      return Response.json({ message: 'PalmPesa authorization is invalid.' }, { status: 401 });
    }
    const transaction = transactions.get(payload.order_id);
    if (!transaction) return Response.json({ message: 'Payment not found.' }, { status: 404 });
    if (transaction.status === 'NOT_FOUND') {
      return Response.json({ message: 'Order not found.' }, { status: 404 });
    }
    return Response.json({ data: [{ payment_status: transaction.status }] });
  }

  if (url.hostname === 'cdn.test' || url.hostname === 'res.cloudinary.com' || url.hostname.endsWith('.b-cdn.net')) {
    if (url.hostname.endsWith('.b-cdn.net') && !new Headers(init?.headers).has('referer')) {
      return new Response('Bunny referrer is missing.', { status: 403 });
    }
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
