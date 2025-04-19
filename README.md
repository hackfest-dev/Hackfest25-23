# RedactLy.AI

A document redaction system that helps protect sensitive information in your documents using AI-powered redaction techniques.

## 🏗️ Architecture Overview

### Backend Architecture (server/)

The backend is built with Flask and consists of several key components:

#### Core Components (`server/src/`)

1. **app.py** - Main Application Entry Point
   - Handles all HTTP routes and API endpoints
   - Manages file uploads and document processing
   - Implements email notifications
   - Key endpoints:
     - `/email/send` - Sends notification emails
     - `/document/add` - Handles document uploads
     - `/documents` - Lists all documents
     - `/document/hash/<hash>` - Retrieves documents by hash
     - `/structured` - Processes structured data
     - `/redact` - Handles document redaction

2. **redaction_service.py**
   - Core redaction logic implementation
   - Handles PDF processing and text extraction
   - Manages redaction patterns and rules

3. **ocr_redaction.py**
   - OCR (Optical Character Recognition) implementation
   - Processes scanned documents
   - Extracts text from images within PDFs

4. **ollamahandler.py**
   - Integration with Ollama AI model
   - Handles AI-powered text analysis
   - Manages model interactions and responses

5. **preprocessor.py**
   - Document preprocessing utilities
   - Text cleaning and normalization
   - Format conversion helpers

6. **auto_emailer.py**
   - Email notification system
   - Template management
   - Email sending utilities

7. **config.py**
   - Configuration management
   - Environment variables
   - System settings

8. **model.py**
   - Database models
   - Data structures
   - Schema definitions

#### Database Structure (`server/database/`)
- SQLite database implementation
- Document storage and retrieval
- Hash management for documents

#### Storage Directories
- `temp_uploads/` - Temporary file storage
- `document_storage/` - Permanent document storage

### Frontend Architecture (client/)

The frontend is built with React, TypeScript, and Vite, featuring a modern component-based architecture.

#### Core Components (`client/src/`)

1. **App.tsx** - Root Component
   - Application routing
   - Theme management
   - Global state setup
   - Toast notifications

2. **Components Directory (`components/`)**
   - Reusable UI components
   - Theme toggle
   - Form elements
   - Layout components

3. **Pages Directory (`pages/`)**
   - Route-based components
   - Main application views
   - Error pages

4. **Hooks Directory (`hooks/`)**
   - Custom React hooks
   - API integration hooks
   - State management hooks

5. **Types Directory (`types/`)**
   - TypeScript type definitions
   - Interface declarations
   - Type utilities

6. **Lib Directory (`lib/`)**
   - Utility functions
   - API clients
   - Helper functions

## 🚀 Getting Started

### Prerequisites
- Docker
- Docker Compose

### Running with Docker

1. Clone the repository:
```bash
git clone [your-repo-url]
cd Hackfest25-23
```

2. Start the application:
```bash
docker-compose up --build
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

## 📝 API Documentation

### Document Management

1. **Upload Document**
```bash
POST /document/add
Content-Type: multipart/form-data
Body:
  - file: PDF file
  - email: user@example.com
```

2. **List Documents**
```bash
GET /documents?email=user@example.com
```

3. **Get Document by Hash**
```bash
GET /document/hash/<hash>
```

4. **Process Document**
```bash
POST /redact
Content-Type: multipart/form-data
Body:
  - files: PDF file(s)
  - method: redaction method
```

### Email Notifications

```bash
POST /email/send
Content-Type: application/json
Body:
{
  "email": "recipient@example.com",
  "subject": "Document Verification",
  "contents": "Please verify the redacted document"
}
```

## 🔐 Security Features

- File upload validation
- Secure file storage
- Hash-based document retrieval
- Rate limiting
- CORS protection
- Input sanitization

## 🛠️ Development Guidelines

### Backend Development
1. Follow PEP 8 style guide
2. Add docstrings to all functions
3. Implement error handling
4. Write unit tests for new features

### Frontend Development
1. Use TypeScript for type safety
2. Follow React best practices
3. Implement responsive design
4. Maintain component reusability

## 📄 License

This project is licensed under the MIT License.