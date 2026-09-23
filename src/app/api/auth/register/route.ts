import { NextResponse } from 'next/server';
import { handleRouteError } from '@/lib/apiResponse';
import { RegisterZodSchema } from '@/lib/validationZodSchema/RegisterZodSchema';
import { registerUser } from '@/server/auth/registerUser';

export async function POST(request: Request) {
  try {
    const input = RegisterZodSchema.parse(await request.json());
    const result = await registerUser(input);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
