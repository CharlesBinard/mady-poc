import { revalidatePath, revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';

export async function POST(request: Request): Promise<Response> {
  const secret = request.headers.get('x-revalidate-secret');
  const expected = process.env.REVALIDATE_SECRET;
  if (!expected || secret !== expected) {
    return NextResponse.json({ revalidated: false, error: 'unauthorized' }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    tag?: string;
    path?: string;
  } | null;

  if (!body) {
    return NextResponse.json({ revalidated: false, error: 'invalid body' }, { status: 400 });
  }

  const ALLOWED_PATH = /^\/(fr|en)(\/(produit|categorie-produit)\/[\w-]+|\/[\w-]+)?$/;
  if (body.path && !ALLOWED_PATH.test(body.path)) {
    return NextResponse.json({ revalidated: false, error: 'invalid path' }, { status: 400 });
  }

  if (body.tag) revalidateTag(body.tag);
  if (body.path) revalidatePath(body.path);

  return NextResponse.json({
    revalidated: true,
    tag: body.tag,
    path: body.path,
  });
}
