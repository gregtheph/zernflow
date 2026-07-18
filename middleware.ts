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
          // ۱. روی رکوئست فقط نام و مقدار ست می‌شود (تایپ RequestCookie)
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value)
          })
          
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          
          // ۲. روی ریسپانس کل آپشن‌ها برای مرورگر فرستاده می‌شود
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const url = request.nextUrl.clone()

  // اگر کاربر لاگین نکرده و می‌خواهد به صفحات داشبورد برود
  if (!user && url.pathname.startsWith('/dashboard')) {
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // اگر کاربر لاگین کرده و می‌خواهد به صفحات عمومی یا لاگین برود
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
