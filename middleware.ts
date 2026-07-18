import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * فقط روی صفحاتی که نیاز به قفل و احراز هویت دارند (مثل داشبورد و تنظیمات) اجرا شود.
     * صفحات عمومی، لاگین، استاتیک و عکس‌ها کاملاً نادیده گرفته می‌شوند.
     */
    "/dashboard/:path*",
    "/api/protected/:path*", // اگر مسیر ای‌پیاآی قفل‌شده‌ای داری    ],
};
