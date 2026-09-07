import type { Metadata, Viewport } from "next";
import { Noto_Sans_KR } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const noto = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  variable: "--font-noto",
  display: "swap",
});

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? "순보고";
const CHURCH = process.env.NEXT_PUBLIC_CHURCH_NAME ?? "해운대순복음교회";

export const metadata: Metadata = {
  title: { default: `${APP_NAME} | ${CHURCH}`, template: `%s | ${APP_NAME}` },
  description: `${CHURCH} 순장·선교회장·담임목사를 위한 주간 보고 앱`,
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "default", title: APP_NAME },
  formatDetection: { telephone: false },
  icons: { icon: "/logo.png", apple: "/logo.png" },
};

export const viewport: Viewport = {
  themeColor: "#2447ea",
  width: "device-width",
  initialScale: 1,
  maximumScale: 3,
  viewportFit: "cover",
};

/** 글자 크기 설정을 렌더 전에 적용 (깜빡임 방지) */
const fontSizeScript = `try{var f=localStorage.getItem("sunbogo:font");if(f==="large")document.documentElement.setAttribute("data-font","large");}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={noto.variable} suppressHydrationWarning>
      <head>
        <script id="font-size-init" dangerouslySetInnerHTML={{ __html: fontSizeScript }} />
      </head>
      <body className="min-h-dvh antialiased">
        {children}
        <Toaster
          richColors
          position="top-center"
          closeButton
          toastOptions={{
            style: { fontSize: "1.05rem", padding: "18px 20px", borderRadius: "18px" },
            duration: 3500,
          }}
        />
      </body>
    </html>
  );
}
