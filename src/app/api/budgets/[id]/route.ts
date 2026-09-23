import { NextResponse } from 'next/server';
import { handleRouteError } from '@/lib/apiResponse';
import { UpdateBudgetZodSchema } from '@/lib/validationZodSchema/BudgetZodSchema';
import { requireAdmin } from '@/server/auth/sessionCookie';
import { deleteBudget, updateBudget } from '@/server/budgets/saveBudget';

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  try {
    const session = await requireAdmin();
    const { id } = await context.params;
    const input = UpdateBudgetZodSchema.parse(await request.json());
    return NextResponse.json(await updateBudget(session, id, input));
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(_request: Request, context: Context) {
  try {
    const session = await requireAdmin();
    const { id } = await context.params;
    await deleteBudget(session, id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
