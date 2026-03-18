# 🥢 DishDecode - AI 智能中式菜谱解码器

**DishDecode** 是一款专为在华外籍人士设计的 AI 菜单识别应用。通过扫描中文菜单，利用 Gemini 1.5/2.0 Flash 强大的视觉能力，即时为用户提供双语对照、配料分析及过敏风险提醒。

![Next.js](https://img.shields.io/badge/Next.js-14-black)
![Gemini AI](https://img.shields.io/badge/AI-Gemini_Flash-blue)
![Tailwind CSS](https://img.shields.io/badge/Style-Minimalist-green)

## ✨ 核心功能

- **📸 智能扫描**：拍摄菜单照片，AI 自动识别所有可见菜品。
- **🌍 中英双语**：自动翻译菜名，并在下方标注原中文名，方便与餐厅员工核对。
- **🛡️ 过敏原提醒**：根据用户设置（如花生、海鲜过敏），自动在菜单中标记“危险（Danger）”菜品。
- **🍱 成分解析**：不仅有菜名，还能解析核心配料（中英对照），让吃得更透明。
- **💵 实时换算**：自动将人民币价格换算为美元，方便预算管理。
- **🏮 极简视觉**：采用现代中式审美设计，全屏列表适配手机单手操作。

## 🚀 快速开始

1. **环境准备**：
   - 获取一个 [Google Gemini API Key](https://aistudio.google.com/app/apikey)。
   - 确保安装了 Node.js 18+。

2. **本地运行**：
   ```bash
   git clone https://github.com/wangqinghuan/dishdecode.git
   cd dishdecode
   npm install
   ```

3. **配置变量**：
   创建 `.env.local` 文件并添加：
   ```env
   GEMINI_API_KEY=你的API_KEY
   ```

4. **启动开发服务器**：
   ```bash
   npm run dev
   ```
   访问 [http://localhost:3000](http://localhost:3000) 即可开始体验。

## 🛠️ 技术栈

- **Frontend**: Next.js (App Router), Lucide React
- **Backend**: Next.js API Routes (Serverless)
- **AI Engine**: Google Gemini 1.5 Flash (Multimodal)
- **Styling**: Vanilla CSS (Modern Minimalist Theme)

## 📸 预览

*(在此处添加你的应用截图)*

---
Made with ❤️ for Expats in China.
