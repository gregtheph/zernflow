import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set({
              name,
              value,
              ...options,
              sameSite: 'lax',
              secure: true,
              path: '/',
            })
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set({
              name,
              value,
              ...options,
              sameSite: 'lax',
              secure: true,
              path: '/',
            })
          })
        },
      },
    }
  )

  // استفاده از getUser که همیشه دیتای زنده و واقعی را از سرور سوپابیس می‌گیرد
  const { data: { user } } = await supabase.auth.getUser()
  const url = request.nextUrl.clone()

  // 1. اگر کاربر لاگین نکرده و می‌خواهد به صفحات داشبورد برود
  if (!user && url.pathname.startsWith('/dashboard')) {
    // برای اینکه مطمئن شویم کاربر بعد از لاگین مستقیم به همان صفحه‌ای برود که می‌خواست
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/login'
    redirectUrl.searchParams.set('next', url.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // 2. اگر کاربر لاگین کرده و می‌خواهد به صفحات عمومی یا لاگین برود
  // 💡 نکته مهم: فقط اگر دقیقاً روی /login یا / یا /register بود برود به /dashboard/flows تا لوپ ایجاد نشود
  if (user && (url.pathname === '/login' || url.pathname === '/register' || url.pathname === '/')) {
    url.pathname = '/dashboard/flows'
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
