import { NextResponse } from 'next/server';
import { handleRouteError } from '@/lib/apiResponse';
import { getInvitePreview } from '@/server/invites/getInvite';

// Pública: quem recebeu o link ainda não tem conta.
export async function GET(_request: Request, context: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await context.params;
    return NextResponse.json(await getInvitePreview(token));
  } catch (error) {
    return handleRouteError(error);
  }
}
