import { NextResponse } from 'next/server';
import { handleRouteError } from '@/lib/apiResponse';
import { BudgetQueryZodSchema } from '@/lib/validationZodSchema/BudgetZodSchema';
import { requireSession } from '@/server/auth/sessionCookie';
import { getDashboard } from '@/server/dashboard/getDashboard';

export async function GET(request: Request) {
  try {
    const session = await requireSession();
    // mesmo formato de `?month=AAAA-MM` dos orçamentos
    const { month } = BudgetQueryZodSchema.parse(Object.fromEntries(new URL(request.url).searchParams));
    return NextResponse.json(await getDashboard(session, month));
  } catch (error) {
    return handleRouteError(error);
  }
}
