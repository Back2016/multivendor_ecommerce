import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

export default clerkMiddleware(async (auth, req, next) => {
  const protectedRoutes = createRouteMatcher([
    "/dashboard",
    "/dashboard/(.*)",
    // If want to protected all child url, for example /dashboard , do "/dashboard/(.*)"
  ]);

  if (protectedRoutes(req)) {
    // Redirect to signin page if a protected page is visited without credentials
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
