import { NextResponse } from 'next/server';
import { deleteCachedEvaluation, getAllCacheStatus } from '@/lib/kv-cache';
import { GROUPS, type Group } from '@/types';

export const runtime = 'nodejs';

export async function GET() {
  const status = await getAllCacheStatus();
  return NextResponse.json({ status });
}

export async function DELETE(req: Request) {
  const url = new URL(req.url);
  const group = url.searchParams.get('group');
  if (!group || !(GROUPS as readonly string[]).includes(group)) {
    return NextResponse.json({ error: 'invalid or missing group' }, { status: 400 });
  }
  try {
    await deleteCachedEvaluation(group as Group);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'kv error' }, { status: 500 });
  }
}
