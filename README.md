# 🤖 AI Code Assistant

<div align="center">

![AI Code Assistant](https://img.shields.io/badge/AI-Code%20Assistant-blue?style=for-the-badge&logo=robot)
![Next.js](https://img.shields.io/badge/Next.js-15.3.3-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)
![React](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react)

**Your intelligent coding companion with real-time web search capabilities**

*Built by `_dr_misterio_`*

[🚀 Live Demo](#) • [📖 Documentation](#features) • [🐛 Issues](https://github.com/tachiba-11211/Coder/issues) • [💡 Features](#features)

</div>

---

## ✨ Features

### 🔧 **Smart Development**
- **🤖 AI-Powered Code Generation**: Create complete projects from simple descriptions
- **📝 Direct File Editing**: Modify existing files automatically with AI assistance
- **🔍 Real-time Error Detection**: Automatically detect and fix code errors
- **🌿 Branch Management**: Organized workflow with automatic branch creation

### 🌐 **Web-Enhanced Intelligence**
- **🔍 Live Web Search**: Automatically searches for latest documentation and solutions
- **📚 Current Information**: Uses up-to-date examples and best practices
- **🆕 Technology Updates**: Stays current with latest frameworks and libraries
- **🔗 Smart Resource Finding**: Finds relevant Stack Overflow, GitHub, and documentation links

### 🎯 **Intelligent Workflow**
- **🎨 Project Creation**: `"create a React calculator"` → Complete project with files
- **✏️ File Modification**: `"fix the login function"` → Direct code changes
- **💬 Code Explanation**: `"explain this component"` → Detailed analysis of your codebase
- **🔄 Auto Error Fixing**: Detects issues and applies fixes automatically

### 🧠 **Advanced Memory System**
- **📝 Short-term Memory**: Remembers recent conversations and changes
- **🏛️ Long-term Memory**: Maintains project context across sessions
- **🌳 Branch Context**: Each branch maintains its own chat and memory
- **📊 Progress Tracking**: Real-time status updates with pause/resume functionality

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm, yarn, pnpm, or bun

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/tachiba-11211/Coder.git
   cd Coder
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   # or
   bun install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Configure your AI API settings in `.env.local`:
   ```env
   NEXT_PUBLIC_POLLINATIONS_API_URL=https://text.pollinations.ai/openai
   NEXT_PUBLIC_AI_MODELS=openai,openai-fast,qwen-coder,llama,mistral
   # Add your API tokens if required
   NEXT_PUBLIC_POLLINATIONS_TOKEN=your_token_here
   NEXT_PUBLIC_POLLINATIONS_REFERRER=your_domain_here
   ```

4. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   # or
   bun dev
   ```

### 🧹 **Troubleshooting Cache Issues**

If you encounter CSS parsing errors or build issues, try these cleanup commands:

```bash
# Clean all cache files and reinstall
npm run fresh-install

# Clean and start development server
npm run fresh-dev

# Manual cleanup (if needed)
npm run clean
```

**Common issues and solutions:**
- **CSS @import errors**: Run `npm run fresh-install` to clear build cache
- **Module not found**: Delete `node_modules` and reinstall dependencies
- **Build failures**: Clear `.next` folder and restart dev server

5. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000) to see the magic! ✨

---

## 🎮 How to Use

### 🆕 **Creating New Projects**
```
"create a simple Python calculator"
"build a React todo app with TypeScript"
"generate a Node.js API for user management"
```
→ Creates new branch with complete project structure

### ✏️ **Editing Existing Code**
```
"fix the login function to handle errors"
"add dark mode to the header component"
"update the API to use async/await"
```
→ Modifies files directly in your current branch

### 💬 **Getting Explanations**
```
"explain how this React hook works"
"what does this Python function do?"
"analyze the performance of this code"
```
→ Provides detailed analysis based on your entire codebase

### 🔧 **Advanced Features**
- **Web Search**: Ask about latest technologies - AI automatically searches for current info
- **Error Fixing**: AI detects errors and applies fixes automatically
- **Branch Switching**: Work on multiple features simultaneously
- **Memory Context**: AI remembers your project history and preferences

---

## 🏗️ Tech Stack

| Technology | Purpose | Version |
|------------|---------|---------|
| ![Next.js](https://img.shields.io/badge/Next.js-black?logo=next.js) | React Framework | 15.3.3 |
| ![TypeScript](https://img.shields.io/badge/TypeScript-blue?logo=typescript) | Type Safety | 5.x |
| ![React](https://img.shields.io/badge/React-61DAFB?logo=react) | UI Library | 19.0 |
| ![Tailwind](https://img.shields.io/badge/Tailwind-38B2AC?logo=tailwind-css) | Styling | 4.x |
| ![Zustand](https://img.shields.io/badge/Zustand-orange) | State Management | 5.x |
| ![Monaco](https://img.shields.io/badge/Monaco-007ACC?logo=visual-studio-code) | Code Editor | 4.7.0 |

---

## 📁 Project Structure

```
src/
├── app/                 # Next.js App Router
│   ├── layout.tsx      # Root layout
│   ├── page.tsx        # Main application
│   └── globals.css     # Global styles
├── components/         # React components
│   ├── MainSection.tsx # AI chat interface
│   ├── ProjectExplorer.tsx # File tree
│   ├── FileEditor.tsx  # Code editor
│   ├── BranchSelector.tsx # Git-like branches
│   └── Settings.tsx    # Configuration
├── store/             # State management
│   ├── projectStore.ts # Project and file state
│   └── branchStore.ts  # Branch and memory state
└── utils/             # Utility functions
    └── codeGeneration.ts # AI response parsing
```

---

## 🎨 Screenshots

<div align="center">

### 💬 **AI Chat Interface**
*Intelligent conversation with your code*

### 📁 **Project Explorer** 
*Visual file tree with real-time updates*

### ✏️ **Code Editor**
*Monaco-powered editing experience*

### 🌿 **Branch Management**
*Git-like branching for organized development*

</div>

---

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. **🍴 Fork the repository**
2. **🌿 Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **💾 Commit your changes** (`git commit -m 'Add amazing feature'`)
4. **📤 Push to the branch** (`git push origin feature/amazing-feature`)
5. **🔄 Open a Pull Request**

### 🐛 Bug Reports
Found a bug? [Open an issue](https://github.com/tachiba-11211/Coder/issues) with:
- Clear description
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🌟 Acknowledgments

- **AI Integration**: Powered by [Pollinations.ai](https://pollinations.ai)
- **Code Editor**: [Monaco Editor](https://microsoft.github.io/monaco-editor/)
- **Icons**: [Lucide React](https://lucide.dev)
- **Styling**: [Tailwind CSS](https://tailwindcss.com)

---

<div align="center">

**Built with ❤️ by `_dr_misterio_`**

*Making coding more intelligent, one conversation at a time*

[![GitHub stars](https://img.shields.io/github/stars/tachiba-11211/Coder?style=social)](https://github.com/tachiba-11211/Coder/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/tachiba-11211/Coder?style=social)](https://github.com/tachiba-11211/Coder/network/members)

[⭐ Star this repo](https://github.com/tachiba-11211/Coder) • [🐛 Report Bug](https://github.com/tachiba-11211/Coder/issues) • [💡 Request Feature](https://github.com/tachiba-11211/Coder/issues)

</div>
