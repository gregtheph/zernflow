import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // ۱. راه‌اندازی کلاینت سوپابیس برای مدیریت کوکی‌ها
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set({ name, value, ...options }))
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set({ name, value, ...options }))
        },
      },
    }
  )

  // ۲. گرفتن اطلاعات کاربر فعلی
  const { data: { user } } = await supabase.auth.getUser()

  const url = request.nextUrl.clone()
  
  // ۳. جلوگیری از لوپ ریدایرکت (شرط‌های طلایی)
  
  // اگر کاربر لاگین نکرده و می‌خواهد به صفحات محافظت‌شده (مثل داشبورد) برود -> بفرستش صفحه لاگین
  if (!user && url.pathname.startsWith('/dashboard')) {
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // اگر کاربر لاگین کرده و دوباره به صفحه لاگین یا ثبت‌نام رفته -> مستقیم بفرستش داخل داشبورد
  if (user && (url.pathname === '/login' || url.pathname === '/register' || url.pathname === '/')) {
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return response
}

// همان ماتچر اصلی و کامل که می‌خواستی
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
