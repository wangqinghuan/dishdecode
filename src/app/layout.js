import '../styles/theme.css';

export const metadata = {
  title: 'DishDecode - AI Menu App',
  description: 'AI-powered menu recognizer for expats in China.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'DishDecode',
  },
  themeColor: '#c83c23',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body>
        <main className="container">
          {children}
        </main>
      </body>
    </html>
  );
}
