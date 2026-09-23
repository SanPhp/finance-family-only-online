import { NextResponse } from 'next/server';
import { handleRouteError } from '@/lib/apiResponse';
import { UpdateCommitmentZodSchema } from '@/lib/validationZodSchema/CommitmentZodSchema';
import { requireSession } from '@/server/auth/sessionCookie';
import { updateCommitment } from '@/server/commitments/saveCommitment';

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession();
    const { id } = await context.params;
    const input = UpdateCommitmentZodSchema.parse(await request.json());
    return NextResponse.json(await updateCommitment(session, id, input));
  } catch (error) {
    return handleRouteError(error);
  }
}
