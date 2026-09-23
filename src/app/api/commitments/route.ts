import { NextResponse } from 'next/server';
import { handleRouteError } from '@/lib/apiResponse';
import { CreateCommitmentZodSchema } from '@/lib/validationZodSchema/CommitmentZodSchema';
import { requireSession } from '@/server/auth/sessionCookie';
import { createCommitment } from '@/server/commitments/saveCommitment';
import { listCommitments } from '@/server/commitments/listCommitments';

// Qualquer membro pode gerenciar compromissos (é acompanhamento pessoal de dívida, não afeta orçamento da família).
export async function GET() {
  try {
    const session = await requireSession();
    return NextResponse.json(await listCommitments(session));
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const input = CreateCommitmentZodSchema.parse(await request.json());
    return NextResponse.json(await createCommitment(session, input), { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
