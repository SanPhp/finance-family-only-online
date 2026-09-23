import { NextResponse } from 'next/server';
import { handleRouteError } from '@/lib/apiResponse';
import { clearSessionCookie } from '@/server/auth/sessionCookie';

export async function POST() {
  try {
    await clearSessionCookie();
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
