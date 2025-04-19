# Document Redaction System - HackFest 2024

A full-stack application for document redaction, built with modern web technologies. This system allows users to upload documents and apply various redaction methods to protect sensitive information.

## 🌟 Features

- **Document Processing**
  - Multiple file format support
  - Drag-and-drop file upload
  - Real-time preview
  - Multiple redaction methods

- **User Interface**
  - Modern, responsive design
  - Dark/Light theme support
  - Intuitive user experience
  - Real-time feedback with toast notifications

- **Backend Processing**
  - Fast document processing
  - Multiple redaction algorithms
  - Secure file handling
  - API rate limiting

## 🏗️ Project Structure

```
HackFest2024/
├── client/                 # Frontend React application
│   ├── src/               # Source code
│   │   ├── components/    # React components
│   │   ├── hooks/        # Custom React hooks
│   │   ├── pages/        # Page components
│   │   └── lib/          # Utilities and configurations
│   └── README.md         # Frontend documentation
│
├── server/                # Backend FastAPI application
│   ├── app/              # Application code
│   │   ├── api/          # API endpoints
│   │   ├── core/         # Core functionality
│   │   └── services/     # Business logic
│   └── README.md         # Backend documentation
│
└── README.md             # This file
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- Python (v3.8 or higher)
- npm or yarn
- pip

### Frontend Setup

1. Navigate to the client directory:
   ```bash
   cd client
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

### Backend Setup

1. Navigate to the server directory:
   ```bash
   cd server
   ```

2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: .\venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Start the server:
   ```bash
   uvicorn app.main:app --reload
   ```

## 🛠️ Tech Stack

### Frontend
- React 18
- TypeScript
- Vite
- Tailwind CSS
- Shadcn UI Components

### Backend
- FastAPI
- Python
- SQLAlchemy
- Pydantic
- Uvicorn

## 📝 Development Guidelines

1. **Code Style**
   - Follow TypeScript/Python best practices
   - Use meaningful variable and function names
   - Add appropriate comments for complex logic
   - Follow existing code formatting

2. **Git Workflow**
   - Create feature branches from main
   - Use meaningful commit messages
   - Submit pull requests for review
   - Keep commits atomic and focused

3. **Testing**
   - Write tests for new features
   - Ensure all tests pass before submitting PR
   - Include both unit and integration tests

## 🔐 Security Considerations

- All file uploads are validated
- Sensitive data is properly redacted
- API endpoints are rate-limited
- Input validation on both frontend and backend

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Contributors

- [Your Name/Team Name]
- [Other Contributors]

## 🙏 Acknowledgments

- HackFest 2024 organizers
- All contributors and supporters
- Open source community