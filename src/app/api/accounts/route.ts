import { NextResponse } from 'next/server';
import { handleRouteError } from '@/lib/apiResponse';
import { CreateAccountZodSchema } from '@/lib/validationZodSchema/AccountZodSchema';
import { listAccounts } from '@/server/accounts/listAccounts';
import { createAccount } from '@/server/accounts/saveAccount';
import { requireAdmin, requireSession } from '@/server/auth/sessionCookie';

export async function GET() {
  try {
    const session = await requireSession();
    return NextResponse.json(await listAccounts(session));
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAdmin();
    const input = CreateAccountZodSchema.parse(await request.json());
    return NextResponse.json(await createAccount(session, input), { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
