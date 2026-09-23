import { NextResponse } from 'next/server';
import { handleRouteError } from '@/lib/apiResponse';
import { CreateTransactionZodSchema, TransactionQueryZodSchema } from '@/lib/validationZodSchema/TransactionZodSchema';
import { requireSession } from '@/server/auth/sessionCookie';
import { listTransactions } from '@/server/transactions/listTransactions';
import { createTransaction } from '@/server/transactions/saveTransaction';

export async function GET(request: Request) {
  try {
    const session = await requireSession();
    const query = TransactionQueryZodSchema.parse(Object.fromEntries(new URL(request.url).searchParams));
    return NextResponse.json(await listTransactions(session, query));
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const input = CreateTransactionZodSchema.parse(await request.json());
    const { transaction, created } = await createTransaction(session, input);
    return NextResponse.json(transaction, { status: created ? 201 : 200 });
  } catch (error) {
    return handleRouteError(error);
  }
}
