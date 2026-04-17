import { NextResponse } from 'next/server';
import { getPayloadClient } from '@/lib/payload';

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const from = url.searchParams.get('from');
  if (!from) return NextResponse.json(null);

  try {
    const payload = await getPayloadClient();
    const { docs } = await payload.find({
      collection: 'redirects',
      where: { from: { equals: from } },
      limit: 1,
    });
    const doc = docs[0];
    if (!doc) return NextResponse.json(null);
    return NextResponse.json({ to: doc.to, type: doc.type });
  } catch (err) {
    console.error('[redirect-lookup]', err);
    return NextResponse.json(null);
  }
}
