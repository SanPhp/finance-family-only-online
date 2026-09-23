import { NextResponse } from 'next/server';
import { handleRouteError } from '@/lib/apiResponse';
import { UpdateCategoryZodSchema } from '@/lib/validationZodSchema/CategoryZodSchema';
import { requireAdmin } from '@/server/auth/sessionCookie';
import { updateCategory } from '@/server/categories/saveCategory';

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdmin();
    const { id } = await context.params;
    const input = UpdateCategoryZodSchema.parse(await request.json());
    return NextResponse.json(await updateCategory(session, id, input));
  } catch (error) {
    return handleRouteError(error);
  }
}
