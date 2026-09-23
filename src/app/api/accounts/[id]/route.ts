import { NextResponse } from 'next/server';
import { handleRouteError } from '@/lib/apiResponse';
import { UpdateAccountZodSchema } from '@/lib/validationZodSchema/AccountZodSchema';
import { updateAccount } from '@/server/accounts/saveAccount';
import { requireAdmin } from '@/server/auth/sessionCookie';

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdmin();
    const { id } = await context.params;
    const input = UpdateAccountZodSchema.parse(await request.json());
    return NextResponse.json(await updateAccount(session, id, input));
  } catch (error) {
    return handleRouteError(error);
  }
}
