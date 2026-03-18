# 🥢 DishDecode - AI-Powered Chinese Menu Decoder

**DishDecode** is a specialized web application designed for expats and travelers in China. Leveraging the advanced multimodal capabilities of Google Gemini 1.5/2.0 Flash, it instantly "decodes" Chinese-only menus into clear, bilingual lists with ingredient analysis and safety alerts.

![Next.js](https://img.shields.io/badge/Next.js-14-black)
![Gemini AI](https://img.shields.io/badge/AI-Gemini_Flash-blue)
![PWA](https://img.shields.io/badge/PWA-Ready-orange)
![Style](https://img.shields.io/badge/Style-Minimalist_Zen-green)

## ✨ Core Features

- **📸 Intelligent Scanning**: Snap a single photo of a complex menu, and the AI extracts every dish with high precision.
- **🌍 Bilingual Interface**: Displays the original Chinese names alongside English translations, allowing for easy verification with restaurant staff.
- **🛡️ Allergy & Dietary Safety**: Set your profile (e.g., Peanuts, Seafood, Pork) and the app will automatically "Red-Flag" risky dishes.
- **🍱 Ingredient Breakdown**: Go beyond just the name; see the top 3-4 key ingredients for every dish in both languages.
- **💵 Instant Currency Conversion**: Automatically converts CNY (¥) prices to USD ($) based on real-time reference rates.
- **🏮 Minimalist Zen Design**: A full-width, mobile-optimized list view inspired by modern Chinese aesthetics, designed for one-handed use in busy restaurants.
- **📱 PWA Ready**: "Add to Home Screen" to use it like a native app without any installation from the App Store.

## 🚀 Quick Start

### Prerequisites
- A [Google Gemini API Key](https://aistudio.google.com/app/apikey).
- Node.js 18+ installed on your machine.

### Local Development
1. **Clone the repository**:
   ```bash
   git clone https://github.com/wangqinghuan/dishdecode.git
   cd dishdecode
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env.local` file in the root directory and add your key:
   ```env
   GEMINI_API_KEY=your_api_key_here
   ```

4. **Run the development server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router), Lucide React
- **Backend**: Next.js API Routes (Serverless)
- **AI Engine**: Google Gemini 1.5/2.0 Flash (Multimodal Vision)
- **Styling**: Vanilla CSS with CSS Variables (Zen Minimalist Theme)
- **Deployment**: Optimized for Vercel

## 📱 PWA Support
DishDecode is a Progressive Web App. To "install" it:
- **On iOS (Safari)**: Tap **Share** -> **Add to Home Screen**.
- **On Android (Chrome)**: Tap the **three-dot menu** -> **Install App**.

---
Made with ❤️ for the Expat Community in China.
