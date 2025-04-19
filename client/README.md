# Document Redaction Client

This is the frontend application for the Document Redaction system, built with React, TypeScript, and Vite.

## 🚀 Features

- File upload and processing
- Multiple redaction methods
- Real-time preview
- Dark/Light theme support
- Toast notifications for user feedback

## 🛠️ Tech Stack

- React 18
- TypeScript
- Vite
- Tailwind CSS
- Shadcn UI Components

## 📁 Project Structure

```
client/
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── ui/            # Base UI components
│   │   ├── FileUploadZone.tsx
│   │   ├── RedactionMethodSelect.tsx
│   │   └── ThemeToggle.tsx
│   ├── hooks/             # Custom React hooks
│   │   └── use-toast.ts   # Toast notification hook
│   ├── pages/             # Page components
│   │   └── Index.tsx      # Main application page
│   ├── lib/               # Utility functions and configurations
│   ├── App.tsx            # Root component
│   └── main.tsx           # Application entry point
```

## 🏗️ Components

### FileUploadZone
Handles file upload functionality with drag-and-drop support and file validation.

### RedactionMethodSelect
Provides interface for selecting different redaction methods for document processing.

### ThemeToggle
Controls the application's theme switching between light and dark modes.

## 🚀 Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Build for production:
   ```bash
   npm run build
   ```

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

## 🎨 Styling

The application uses Tailwind CSS for styling with a custom configuration. Theme customization can be done through the `tailwind.config.js` file.



## 📝 Development Guidelines

1. Follow TypeScript best practices
2. Use functional components with hooks
3. Implement proper error handling
4. Add appropriate comments for complex logic
5. Follow the existing code style and formatting

## 🤝 Contributing

1. Create a new branch for your feature
2. Make your changes
3. Submit a pull request

