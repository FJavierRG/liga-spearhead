import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const isMock =
    process.env.MOCK_MODE === "true" ||
    process.env.NEXT_PUBLIC_MOCK_MODE === "true";

  if (isMock) {
    return NextResponse.next();
  }

  const { updateSession } = await import("@/lib/supabase/middleware");
  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
