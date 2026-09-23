import { NextResponse } from 'next/server';
import { handleRouteError } from '@/lib/apiResponse';
import { BudgetQueryZodSchema, CreateBudgetZodSchema } from '@/lib/validationZodSchema/BudgetZodSchema';
import { requireAdmin, requireSession } from '@/server/auth/sessionCookie';
import { listBudgets } from '@/server/budgets/listBudgets';
import { createBudget } from '@/server/budgets/saveBudget';

export async function GET(request: Request) {
  try {
    const session = await requireSession();
    const { month } = BudgetQueryZodSchema.parse(Object.fromEntries(new URL(request.url).searchParams));
    return NextResponse.json(await listBudgets(session, month));
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAdmin();
    const input = CreateBudgetZodSchema.parse(await request.json());
    return NextResponse.json(await createBudget(session, input), { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
