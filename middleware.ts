import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set({ name, value, ...options });
            response.cookies.set({ name, value, ...options });
          });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const url = request.nextUrl.clone();

  // اگر کاربر لاگین نیست و می‌خواهد به داشبورد برود
  if (!user && url.pathname.startsWith("/dashboard")) {
    const redirectResponse = NextResponse.redirect(new URL("/login", request.url));
    // کپی کردن کوکی‌های ست شده به پاسخ ریدایرکت
    response.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value);
    });
    return redirectResponse;
  }

  // اگر کاربر لاگین است و می‌خواهد به صفحات عمومی برود
  if (user && (url.pathname === "/login" || url.pathname === "/register" || url.pathname === "/")) {
    const redirectResponse = NextResponse.redirect(new URL("/dashboard/flows", request.url));
    // کپی کردن کوکی‌های ست شده به پاسخ ریدایرکت
    response.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value);
    });
    return redirectResponse;
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
