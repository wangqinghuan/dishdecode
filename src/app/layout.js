import '../styles/theme.css';

export const metadata = {
  title: 'DishDecode - Decode Chinese Menus with Ease',
  description: 'AI-powered menu recognizer for expats in China. Safe, personalized, and cultural.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <main className="container">
          {children}
        </main>
      </body>
    </html>
  );
}
