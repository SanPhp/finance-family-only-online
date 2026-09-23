import { NextResponse } from 'next/server';
import { handleRouteError } from '@/lib/apiResponse';
import { requireSession } from '@/server/auth/sessionCookie';
import { listMembers } from '@/server/members/listMembers';

export async function GET() {
  try {
    const session = await requireSession();
    return NextResponse.json(await listMembers(session));
  } catch (error) {
    return handleRouteError(error);
  }
}
