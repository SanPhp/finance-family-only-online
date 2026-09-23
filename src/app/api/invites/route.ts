import { NextResponse } from 'next/server';
import { handleRouteError } from '@/lib/apiResponse';
import { CreateInviteZodSchema } from '@/lib/validationZodSchema/InviteZodSchema';
import { requireAdmin } from '@/server/auth/sessionCookie';
import { createInvite } from '@/server/invites/createInvite';
import { listPendingInvites } from '@/server/invites/listInvites';

export async function GET() {
  try {
    const session = await requireAdmin();
    return NextResponse.json(await listPendingInvites(session));
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAdmin();
    const input = CreateInviteZodSchema.parse(await request.json());
    return NextResponse.json(await createInvite(session, input), { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
