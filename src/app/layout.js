import '../styles/theme.css';

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://' + process.env.VERCEL_URL || 'http://localhost:3000';

export const metadata = {
  title: 'DishDecode - AI Menu Translation & Discovery in China',
  description: 'The ultimate AI-powered menu recognizer for expats and travelers in China. Snap a photo, translate instantly, and discover authentic Chinese dishes.',
  keywords: 'Chinese menu translation, food OCR, expat tools China, travel China food, DishDecode, AI food recognizer',
  manifest: '/manifest.json',
  metadataBase: new URL(baseUrl),
  alternates: {
    canonical: '/',
  },
  verification: {
    google: 'Kd_pHZRg2BjECIm4Wcp2h7z43A_WI1FYMWSwDGhQVrs',
  },
  openGraph: {
    title: 'DishDecode - AI Menu Translation & Discovery',
    description: 'Snap a photo, translate instantly, and discover authentic Chinese dishes.',
    url: baseUrl,
    siteName: 'DishDecode',
    images: [
      {
        url: '/demo/result1.png',
        width: 800,
        height: 600,
        alt: 'DishDecode App Preview',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DishDecode - AI Menu Translation',
    description: 'The ultimate AI-powered menu recognizer for expats in China.',
    images: ['/demo/result1.png'],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'DishDecode',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        
        {/* Google Analytics 4 */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-HSL3W7CZEG"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-HSL3W7CZEG');
            `,
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js');
                });
              }
            `,
          }}
        />
      </head>
      <body>
        <main className="container">
          {children}
        </main>
      </body>
    </html>
  );
}
