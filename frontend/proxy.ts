// proxy.ts — replaces the deprecated middleware.ts convention (Next.js 16+)
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  matcher: ["/", "/(ar|en)/:path*", "/((?!_next|_vercel|.*\\..*).*)"],
};
