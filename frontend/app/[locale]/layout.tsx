import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { ThemeProvider } from "next-themes";
import { routing } from "@/i18n/routing";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { Providers } from "./providers";
import { Toaster } from "@/components/ui/Toaster";

export const metadata: Metadata = {
  title: "MarketOS — POS & Retail Management",
  description: "Multi-store point-of-sale and inventory management system",
};

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // التأكد من أن اللغة المطلوبة مدعومة
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  // جلب ترجمات اللغة الحالية
  const messages = await getMessages();

  // تحديد الاتجاه بناءً على اللغة
  const dir = locale === "ar" ? "ltr" : "rtl";

  return (
    <html
      lang={locale}
      dir={dir}
      className="h-full"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <body className="h-full flex antialiased bg-[var(--bg-base)] text-[var(--text-primary)]">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <NextIntlClientProvider messages={messages}>
            <Providers>
              <Sidebar />
              <main className="flex flex-col flex-1 min-w-0 h-screen overflow-hidden bg-[var(--bg-base)] text-[var(--text-primary)]">
                {children}
              </main>
              <Toaster />
            </Providers>
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
