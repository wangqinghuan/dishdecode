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
        <style>{`
          .header-actions { position: fixed; top: 16px; right: 16px; z-index: 100; display: flex; gap: 8px; }
          .header-actions a { color: #666; display: flex; align-items: center; gap: 6px; text-decoration: none; font-size: 14px; background: white; padding: 8px 12px; border-radius: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header-actions a:hover { color: #333; }
        `}</style>
        
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
        <div className="header-actions">
          <a href="https://github.com/wangqinghuan" target="_blank" rel="noopener" title="GitHub">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
            </svg>
            GitHub
          </a>
        </div>
        <main className="container">
          {children}
        </main>
      </body>
    </html>
  );
}
