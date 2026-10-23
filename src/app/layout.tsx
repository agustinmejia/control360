import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque } from "next/font/google";
import { ToastProvider } from "@/components/ui/toast";
import { themeInitScript } from "@/lib/ui/theme";
import "./globals.css";

const brandFont = Bricolage_Grotesque({
  variable: "--font-brand",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Control360 · Grupo Pecuario", template: "%s · Control360" },
  description:
    "Gestión operativa de Grupo Pecuario: inventario, ventas, cobros, pagos y ganadería.",
  applicationName: "Control360",
  appleWebApp: { capable: true, title: "Control360", statusBarStyle: "default" },
  formatDetection: { telephone: false },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#157a5b" },
    { media: "(prefers-color-scheme: dark)", color: "#101815" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es-BO"
      className={`${brandFont.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full font-sans">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
