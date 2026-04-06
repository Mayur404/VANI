import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in/:path*',
  '/sign-up/:path*',
  '/sso-callback/:path*',
]);

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();

  const path = req.nextUrl.pathname;

  if (!userId && !isPublicRoute(req)) {
    return NextResponse.redirect(new URL('/sign-in', req.url));
  }

  if (userId && (path.startsWith('/sign-in') || path.startsWith('/sign-up'))) {
    return NextResponse.redirect(new URL('/home', req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico)).*)',
    '/(api|trpc)(.*)',
  ],
};
