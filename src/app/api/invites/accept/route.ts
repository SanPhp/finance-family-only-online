import { NextResponse } from 'next/server';
import { handleRouteError } from '@/lib/apiResponse';
import { AcceptInviteZodSchema } from '@/lib/validationZodSchema/InviteZodSchema';
import { setSessionCookie } from '@/server/auth/sessionCookie';
import { acceptInvite } from '@/server/invites/acceptInvite';

// Pública: cria a conta a partir do convite e já deixa a pessoa logada.
export async function POST(request: Request) {
  try {
    const input = AcceptInviteZodSchema.parse(await request.json());
    const session = await acceptInvite(input);
    await setSessionCookie(session);
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
