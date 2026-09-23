import { NextResponse } from 'next/server';
import { handleRouteError } from '@/lib/apiResponse';
import { UpdateTransactionZodSchema } from '@/lib/validationZodSchema/TransactionZodSchema';
import { requireSession } from '@/server/auth/sessionCookie';
import { deleteTransaction, updateTransaction } from '@/server/transactions/saveTransaction';

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  try {
    const session = await requireSession();
    const { id } = await context.params;
    const input = UpdateTransactionZodSchema.parse(await request.json());
    return NextResponse.json(await updateTransaction(session, id, input));
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(_request: Request, context: Context) {
  try {
    const session = await requireSession();
    const { id } = await context.params;
    return NextResponse.json(await deleteTransaction(session, id));
  } catch (error) {
    return handleRouteError(error);
  }
}
