import { Outfit } from 'next/font/google';
import './globals.css';
import { NextIntlClientProvider } from "next-intl";
import 'mapbox-gl/dist/mapbox-gl.css';

import { SidebarProvider } from '@/context/SidebarContext';
import { ThemeProvider } from '@/context/ThemeContext';
// import { AuthProvider } from '@/AuthProvider';

const outfit = Outfit({
  subsets: ["latin"],
});

export default async function RootLayout({
  children,
  params
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>
}>) {
  const { locale } = await params;
  return (
    <html dir={locale === "ar" ? "rtl" : "ltr"} lang="en">
      <header>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Proplix Dashboard </title>
      </header>
      <body className={`${outfit.className} dark:bg-gray-900`}>
         <NextIntlClientProvider locale={locale}>
        <ThemeProvider>
          {/* <AuthProvider> */}
          <SidebarProvider>{children}</SidebarProvider>
          {/* </AuthProvider> */}
          </ThemeProvider>
          </NextIntlClientProvider>
      </body>
    </html>
  );
}
