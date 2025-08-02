import { betterFetch } from "@better-fetch/fetch";
import { NextResponse, type NextRequest } from "next/server";
import { serverEnv } from "@/env";
import type { Session } from "@/server/auth";
import { getSessionCookie } from "better-auth/cookies";

const authRoutes = ["/signin", "/signup", "/email-verified"];
const passwordRoutes = ["/reset-password", "/forgot-password"];
const adminRoutes = ["/admin"];
const alwaysAllowedRoutes = [
  "/home",
  "/blog",
  "/email-verified",
  "/about",
  "/contact",
  "/pricing",
  "/env-client",
];

export default async function authMiddleware(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);
  const pathName = request.nextUrl.pathname;

  if (pathName === "/") {
    const redirectPath = sessionCookie ? "/app" : "/home";
    return NextResponse.rewrite(new URL(redirectPath, request.url));
  }

  const isAuthRoute = authRoutes.includes(pathName);
  const isPasswordRoute = passwordRoutes.includes(pathName);
  const isAdminRoute = adminRoutes.includes(pathName);
  const alwaysAllowedRoute = alwaysAllowedRoutes.some((route) =>
    pathName.startsWith(route),
  );

  if (alwaysAllowedRoute) return NextResponse.next();

  if (!sessionCookie) {
    if (isAuthRoute || isPasswordRoute) {
      return NextResponse.next();
    }

    return NextResponse.rewrite(new URL("/signin", request.url));
  }

  if (isAdminRoute) {
    const { data: session } = await betterFetch<Session>(
      "/api/auth/get-session",
      {
        baseURL: serverEnv.NEXT_PUBLIC_APP_URL,
        headers: {
          cookie: request.headers.get("cookie") ?? "",
        },
      },
    );

    //this is extra protection, every trpc query/mutation should check if the user is admin
    const isAdmin = session?.user.role === "admin";
    if (!isAdmin) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!api|_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
  ],
};
