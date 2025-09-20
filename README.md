# Help Desk Rosters

A modern help desk ticket management system with role-based access control (RBAC) built with Next.js frontend and Flask API backend.

## Features

- **Role-Based Access Control (RBAC)** - Two user types: Administrators and Help Desk Assistants
- **TypeScript** - For type safety and improved developer experience
- **Next.js** - Full-stack React framework for the frontend
- **Flask API Integration** - Backend API with JWT authentication
- **TailwindCSS** - Utility-first CSS for rapid UI development
- **shadcn/ui** - Reusable UI components
- **PWA** - Progressive Web App support
- **Turborepo** - Optimized monorepo build system

## User Roles

### Administrator
- Access to admin dashboard (`/admin`)
- Manage help desk assistants
- View system analytics and reports
- Configure system settings
- Monitor all support activities

### Help Desk Assistant
- Access to assistant dashboard (`/assist`)
- Manage assigned support tickets
- Track response and resolution times
- Communicate with users
- Update ticket status and priority

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- Flask API server running (see Flask API Requirements below)
- PostgreSQL database (Neon DB recommended)

### Frontend Setup

1. **Install dependencies:**
```bash
npm install
```

2. **Configure environment variables:**
```bash
cp apps/web/.env.example apps/web/.env.local
```

Edit `apps/web/.env.local` and set your Flask API URL:
```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000/api
```

3. **Run the development server:**
```bash
npm run dev
```

Open [http://localhost:3001](http://localhost:3001) in your browser to see the web application.

### Flask API Requirements

Your Flask API should provide the following endpoints:

#### Authentication Endpoints
- `POST /api/auth/login` - User login
  ```json
  // Request
  { "email": "user@example.com", "password": "password123" }
  
  // Response
  { 
    "token": "jwt_token_here", 
    "user": { 
      "id": "user_id", 
      "email": "user@example.com", 
      "name": "User Name",
      "role": "admin" // or "assistant"
    } 
  }
  ```

- `POST /api/auth/register` - User registration (creates assistant by default)
  ```json
  // Request
  { 
    "email": "user@example.com", 
    "password": "password123", 
    "name": "User Name",
    "role": "assistant" 
  }
  
  // Response
  { 
    "token": "jwt_token_here", 
    "user": { 
      "id": "user_id", 
      "email": "user@example.com", 
      "name": "User Name",
      "role": "assistant"
    } 
  }
  ```

- `POST /api/auth/logout` - User logout (optional, mainly clears server-side sessions if any)

- `GET /api/me` - Get current user info (requires Authorization header)
  ```json
  // Headers: Authorization: Bearer <token>
  
  // Response
  { 
    "id": "user_id", 
    "email": "user@example.com", 
    "name": "User Name",
    "role": "admin" // or "assistant"
  }
  ```

#### Database Schema (Example for Neon/PostgreSQL)
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'assistant' CHECK (role IN ('admin', 'assistant')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create first admin user (hash password appropriately)
INSERT INTO users (email, name, password_hash, role) 
VALUES ('admin@example.com', 'System Admin', '$hashed_password', 'admin');
```

### Authentication Flow

1. **Login/Register**: User submits credentials, Flask API returns JWT token
2. **Token Storage**: Frontend stores JWT in localStorage (consider HttpOnly cookies for production)
3. **Session Management**: AuthProvider context manages user state and token
4. **Route Protection**: RequireRole component checks user role before rendering protected pages
5. **API Calls**: JWT token included in Authorization header for authenticated requests

### Development Workflow

1. **Start Flask API**: Ensure your Flask API is running on `http://localhost:5000`
2. **Start Frontend**: Run `npm run dev` to start the Next.js app on `http://localhost:3001`
3. **Test Authentication**: 
   - Register a new assistant account at `/auth/register`
   - Login with admin credentials (if seeded) at `/auth/login`
   - Verify role-based redirects work properly

## Project Structure

```
help-desk-rosters/
├── apps/
│   ├── web/                          # Frontend application (Next.js)
│   │   ├── src/
│   │   │   ├── app/                  # App Router pages
│   │   │   │   ├── admin/            # Admin-only pages
│   │   │   │   ├── assist/           # Assistant pages
│   │   │   │   ├── auth/             # Authentication pages
│   │   │   │   └── unauthorized/     # Access denied page
│   │   │   ├── components/
│   │   │   │   ├── layouts/          # Role-specific layouts
│   │   │   │   │   ├── AdminLayout.tsx
│   │   │   │   │   └── AssistantLayout.tsx
│   │   │   │   ├── RequireRole.tsx   # Route protection component
│   │   │   │   └── ui/               # shadcn/ui components
│   │   │   └── lib/
│   │   │       └── auth.tsx          # Authentication context
```

## Available Scripts

- `npm run dev`: Start all applications in development mode
- `npm run build`: Build all applications  
- `npm run dev:web`: Start only the web application
- `npm run check-types`: Check TypeScript types across all apps
- `cd apps/web && npm run generate-pwa-assets`: Generate PWA assets

## Security Considerations

### Current Implementation (Development)
- JWT tokens stored in localStorage
- Client-side route protection
- Role validation on each request to Flask API

### Production Recommendations
- Use HttpOnly, Secure cookies for token storage
- Implement server-side route protection with Next.js middleware
- Add CSRF protection
- Use HTTPS for all communications
- Implement proper session management and token refresh
- Add rate limiting on authentication endpoints
- Validate JWT tokens on server-side for sensitive operations

## Next Steps

1. **Backend Setup**: Implement the Flask API with the required endpoints
2. **Database Seeding**: Create initial admin user
3. **Testing**: Add authentication and authorization tests
4. **Production Security**: Implement HttpOnly cookies and server-side protection
5. **Features**: Add ticket management, user management, and reporting features
