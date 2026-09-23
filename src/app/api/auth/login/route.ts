import { NextResponse } from 'next/server';
import { handleRouteError } from '@/lib/apiResponse';
import { LoginZodSchema } from '@/lib/validationZodSchema/LoginZodSchema';
import { loginUser } from '@/server/auth/loginUser';
import { setSessionCookie } from '@/server/auth/sessionCookie';

export async function POST(request: Request) {
  try {
    const input = LoginZodSchema.parse(await request.json());
    const session = await loginUser(input);
    await setSessionCookie(session);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
