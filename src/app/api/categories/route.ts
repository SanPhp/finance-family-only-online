import { NextResponse } from 'next/server';
import { handleRouteError } from '@/lib/apiResponse';
import { CreateCategoryZodSchema } from '@/lib/validationZodSchema/CategoryZodSchema';
import { requireAdmin, requireSession } from '@/server/auth/sessionCookie';
import { listCategories } from '@/server/categories/listCategories';
import { createCategory } from '@/server/categories/saveCategory';

export async function GET() {
  try {
    const session = await requireSession();
    return NextResponse.json(await listCategories(session));
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAdmin();
    const input = CreateCategoryZodSchema.parse(await request.json());
    return NextResponse.json(await createCategory(session, input), { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
