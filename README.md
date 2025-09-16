# React Vite Scaffold

A clean, minimal React application scaffold built with modern development tools for fast project startup.

## 🚀 Tech Stack

- **React 18** - Modern React with hooks and functional components
- **Vite** - Lightning-fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework for rapid styling
- **Vitest** - Fast unit testing framework
- **ESLint** - Code linting for consistent code quality
- **Prettier** - Code formatting for consistent style
- **Testing Library** - Simple and complete testing utilities

## 📦 Installation

1. **Clone or use this repository as a template**
   ```bash
   git clone https://github.com/scianid/campaign-maker-newslatch.git my-new-app
   cd my-new-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development**
   ```bash
   npm run dev
   ```

## 🛠️ Development

### Start the development server
```bash
npm run dev
```
The application will be available at `http://localhost:5173`

### Build for production
```bash
npm run build
```

### Preview production build
```bash
npm run preview
```

## 🧪 Testing

### Run tests
```bash
npm test
```

### Run tests with UI
```bash
npm run test:ui
```

### Run tests with coverage
```bash
npm run test:coverage
```

## 🎨 Code Quality

### Lint code
```bash
npm run lint
```

### Fix linting issues
```bash
npm run lint:fix
```

### Format code
```bash
npm run format
```

### Check code formatting
```bash
npm run format:check
```

## 📁 Project Structure

```
campaign-maker-newslatch/
├── public/
│   └── vite.svg
├── src/
│   ├── test/
│   │   ├── App.test.jsx
│   │   ├── example.test.js
│   │   └── setup.js
│   ├── App.jsx
│   ├── index.css
│   └── main.jsx
├── .prettierignore
├── .prettierrc
├── eslint.config.js
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js
└── vite.config.js
```

## 🔧 Configuration

### Vite Configuration
- Hot Module Replacement (HMR) enabled
- React plugin configured
- Vitest integration for testing

### Tailwind CSS
- Configured to work with all JS/JSX files
- PostCSS integration
- Autoprefixer included

### ESLint & Prettier
- Modern ESLint flat config
- React-specific rules enabled
- Prettier integration for consistent formatting

### Tailwind CSS
- Configured to work with all JS/JSX files
- PostCSS integration with Autoprefixer
- Custom animations and utilities ready to extend
- Clean base styles included

### Vitest
- JSDOM environment for DOM testing
- Testing Library integration
- Coverage reporting with V8

## 🚀 Getting Started

1. **Use as template**: Click "Use this template" or clone the repository
2. **Install dependencies**: `npm install`
3. **Start development**: `npm run dev`
4. **Open browser**: Navigate to `http://localhost:5173`
5. **Start building**: Edit `src/App.jsx` to start building your application

## ✨ Features

- **⚡ Fast Development** - Hot Module Replacement with Vite
- **🎨 Styled Components** - Tailwind CSS for rapid UI development
- **🧪 Testing Ready** - Vitest and Testing Library configured
- **📏 Code Quality** - ESLint and Prettier for consistent code
- **📱 Responsive** - Mobile-first Tailwind CSS approach
- **🔧 Extensible** - Easy to add new dependencies and features

## 🔄 Customization

This scaffold is designed to be minimal yet complete. You can easily:

- Add UI component libraries (Radix UI, Headless UI, etc.)
- Integrate state management (Redux, Zustand, etc.)
- Add routing (React Router, etc.)
- Include icon libraries (Lucide, Hero Icons, etc.)
- Set up API clients (Axios, React Query, etc.)

## 📝 Scripts Reference

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm test` | Run tests in watch mode |
| `npm run test:ui` | Run tests with Vitest UI |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run lint` | Check for linting errors |
| `npm run lint:fix` | Fix linting errors automatically |
| `npm run format` | Format code with Prettier |
| `npm run format:check` | Check if code is formatted |

## 🤝 Contributing

This is a scaffold template. Feel free to:
1. Fork and customize for your needs
2. Suggest improvements via issues
3. Submit pull requests for enhancements

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Happy coding! 🚀** This scaffold gives you a solid foundation to build any React application with modern tooling and best practices.