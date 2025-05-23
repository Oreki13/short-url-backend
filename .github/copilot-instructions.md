# Short URL Backend - Copilot Instructions

## Project Overview

This is a high-security short URL management backend built with **Express.js**, **TypeScript**, **Prisma ORM**, and **PostgreSQL**. The project focuses on URL shortening services and user management with enterprise-grade security, maintainability, and code quality standards.

## Architecture & Design Principles

### Core Principles

- **DRY (Don't Repeat Yourself)**: Eliminate code duplication through reusable functions, services, and utilities
- **KISS (Keep It Simple, Stupid)**: Maintain simple, clear, and understandable code
- **Single Responsibility Principle**: Each function/class should have one reason to change
- **High Security**: Implement security-first approach with proper authentication, authorization, and data protection
- **Maintainability**: Code should be easy to read, modify, and extend
- **Testability**: All business logic should be unit testable

### Project Structure

```
src/
├── application/          # Application-level configurations
│   ├── database.ts      # Prisma client setup
│   ├── logger.ts        # Winston logging configuration
│   ├── sentry.ts        # Error monitoring setup
│   └── web.ts           # Express app configuration
├── controller/          # Request handlers (thin layer)
├── service/            # Business logic layer
├── model/              # Data models and types
├── validation/         # Zod validation schemas
├── middleware/         # Express middlewares
├── route/              # Route definitions
├── helper/             # Utility functions
├── job/                # Background jobs/cron tasks
├── error/              # Custom error classes
└── type/               # TypeScript type definitions
```

## Coding Standards

### 1. File Naming Convention

- Use **snake_case** for all files: `user_service.ts`, `auth_middleware.ts`
- Use descriptive names that clearly indicate the file's purpose
- Group related files in appropriate directories

### 2. Function & Variable Naming

- Use **camelCase** for functions and variables: `getUserById`, `accessToken`
- Use **PascalCase** for classes and types: `UserService`, `AuthRequest`
- Use **UPPER_SNAKE_CASE** for constants: `MAX_RETRY_ATTEMPTS`

### 3. Code Organization

#### Controllers (Thin Layer)

- Only handle HTTP-specific logic (request/response)
- Delegate business logic to services
- Always validate input using Zod schemas
- Handle errors consistently using error middleware

```typescript
// Good example
export const createShortLink = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const request = Validation.validate(ShortLinkValidation.CREATE, req.body);
    const result = await ShortLinkService.create(req.user!, request);
    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
```

#### Services (Business Logic)

- Contain all business rules and data processing
- Should be pure functions when possible
- Handle database operations through Prisma
- Return consistent data structures

```typescript
// Good example
class ShortLinkService {
  static async create(
    user: User,
    request: CreateShortLinkRequest
  ): Promise<ShortLinkResponse> {
    // Validate business rules
    await this.validateDomain(request.domain);

    // Generate unique path
    const path = await this.generateUniquePath();

    // Save to database
    const shortLink = await prismaClient.dataUrl.create({
      data: {
        title: request.title,
        destination: request.destination,
        path,
        user_id: user.id,
        count_clicks: 0,
        is_deleted: 0,
      },
    });

    return toShortLinkResponse(shortLink);
  }
}
```

### 4. Security Requirements

#### Authentication & Authorization

- Use JWT tokens with refresh token rotation
- Implement proper session management
- Always validate user permissions before data access
- Use middleware for authentication checks

#### Input Validation

- Validate ALL inputs using Zod schemas
- Sanitize user inputs to prevent injection attacks
- Implement proper error handling for validation failures

#### Rate Limiting & Throttling

- Implement rate limiting on all public endpoints
- Use different limits for authenticated vs unauthenticated users
- Implement CSRF protection for state-changing operations

#### Data Protection

- Hash passwords using bcrypt with proper salt rounds
- Never log sensitive information
- Implement proper audit logging for sensitive operations

### 5. Database Patterns

#### Prisma Usage

- Use transactions for multi-table operations
- Implement soft deletes using `is_deleted` field
- Always use UUID for primary keys
- Include created_at and updated_at timestamps

```typescript
// Good example
static async deleteShortLink(userId: string, linkId: string): Promise<void> {
    await prismaClient.$transaction(async (tx) => {
        // Verify ownership
        const link = await tx.dataUrl.findFirst({
            where: { id: linkId, user_id: userId, is_deleted: 0 }
        });

        if (!link) {
            throw new ResponseError(404, "Short link not found");
        }

        // Soft delete
        await tx.dataUrl.update({
            where: { id: linkId },
            data: { is_deleted: 1 }
        });
    });
}
```

### 6. Error Handling

#### Custom Error Classes

- Use ResponseError for user-facing errors
- Include proper HTTP status codes
- Provide meaningful error messages

#### Error Middleware

- Log all errors appropriately
- Never expose internal errors to users
- Use Sentry for error monitoring in production

### 7. Testing Standards

#### Unit Tests

- Test all service layer functions
- Mock external dependencies (database, APIs)
- Use descriptive test names
- Achieve high code coverage (>80%)

#### Integration Tests

- Test complete API endpoints
- Use test database with proper cleanup
- Test authentication and authorization flows

### 8. Environment & Configuration

#### Environment Variables

- Use .env files for configuration
- Never commit sensitive data
- Validate required environment variables on startup
- Use different configs for dev/test/prod

### 9. Logging & Monitoring

#### Logging Standards

- Use structured logging with Winston
- Include correlation IDs for request tracing
- Log all security-relevant events
- Different log levels: error, warn, info, debug

#### Monitoring

- Integrate with Sentry for error tracking
- Monitor performance metrics
- Set up alerts for critical errors

### 10. Performance Guidelines

#### Database Optimization

- Use proper indexes on frequently queried fields
- Implement pagination for list endpoints
- Use connection pooling
- Monitor query performance

#### Caching Strategy

- Cache frequently accessed data
- Implement proper cache invalidation
- Use Redis for session storage

## API Design Standards

### REST API Guidelines

- Use RESTful endpoints with proper HTTP methods
- Implement consistent response formats
- Use proper HTTP status codes
- Include API versioning (v1, v2, etc.)

### Response Format

```typescript
// Success Response
{
    "success": true,
    "data": {...},
    "pagination": {...} // for list endpoints
}

// Error Response
{
    "success": false,
    "errors": "Error message"
}
```

## Development Workflow

### Code Quality

- Use TypeScript strict mode
- Implement proper linting with ESLint
- Use Prettier for code formatting
- Run tests before committing

### Git Workflow

- Use conventional commits
- Create feature branches for new development
- Require code reviews for production code
- Run CI/CD pipeline on all commits

## Security Checklist

When implementing new features, ensure:

- [ ] Input validation with Zod
- [ ] Authentication and authorization checks
- [ ] Rate limiting applied
- [ ] SQL injection prevention
- [ ] XSS protection
- [ ] CSRF protection for state changes
- [ ] Proper error handling without data leakage
- [ ] Audit logging for sensitive operations
- [ ] Secure session management

## Performance Checklist

- [ ] Database queries are optimized
- [ ] Proper indexing in place
- [ ] Pagination implemented for lists
- [ ] Caching strategy considered
- [ ] Memory usage optimized
- [ ] Background jobs for heavy operations

Remember: **Security, maintainability, and code quality are non-negotiable**. Always prioritize these over rapid development.
