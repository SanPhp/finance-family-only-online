import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { SESSION_COOKIE, verifySession } from '@/lib/session';

// Áreas privadas: adicione aqui os prefixos novos.
const PRIVATE_PREFIXES = ['/dashboard', '/transactions', '/budgets', '/insights', '/members', '/categories', '/accounts', '/commitments'];
const AUTH_PAGES = ['/sign-in', '/sign-up'];

// Proteção inicial das páginas. Não substitui a checagem de cada rota da API (requireSession).
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = await verifySession(request.cookies.get(SESSION_COOKIE)?.value);

  const isPrivate = PRIVATE_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  if (isPrivate && !session) return NextResponse.redirect(new URL('/sign-in', request.url));

  if (AUTH_PAGES.includes(pathname) && session) return NextResponse.redirect(new URL('/dashboard', request.url));

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/transactions/:path*', '/budgets/:path*', '/insights/:path*', '/members/:path*', '/categories/:path*', '/accounts/:path*', '/commitments/:path*', '/sign-in', '/sign-up'],
};
