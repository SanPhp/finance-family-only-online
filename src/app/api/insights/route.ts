import { NextResponse } from 'next/server';
import { handleRouteError } from '@/lib/apiResponse';
import { InsightsQueryZodSchema } from '@/lib/validationZodSchema/InsightsZodSchema';
import { requireSession } from '@/server/auth/sessionCookie';
import { getInsights } from '@/server/insights/getInsights';

export async function GET(request: Request) {
  try {
    const session = await requireSession();
    const { month, today } = InsightsQueryZodSchema.parse(Object.fromEntries(new URL(request.url).searchParams));
    return NextResponse.json(await getInsights(session, month, today));
  } catch (error) {
    return handleRouteError(error);
  }
}
