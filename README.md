# CitySense Server

This is the backend server for the CitySense application, built with Node.js, Express, and Firebase.

## Features

- **API Routes**: RESTful API endpoints for issues, users, and admin operations
- **Authentication**: Firebase Admin SDK for token verification
- **Authorization**: Role-based access control (citizen, admin, volunteer)
- **Data Export**: CSV export functionality for issues and users
- **Email Notifications**: Automated email notifications for issue updates
- **Rate Limiting**: Protection against API abuse
- **Error Handling**: Comprehensive error handling middleware
- **Validation**: Input validation using Joi
- **Security**: Helmet.js for security headers

## API Endpoints

### Issues
- `GET /api/issues` - Get all issues with filtering and pagination
- `GET /api/issues/:id` - Get specific issue by ID
- `GET /api/issues/user/:userId` - Get issues by user
- `PATCH /api/issues/:id/status` - Update issue status (admin only)
- `DELETE /api/issues/:id` - Delete issue (admin only)
- `GET /api/issues/stats/overview` - Get issue statistics

### Authentication
- `GET /api/auth/profile` - Get user profile
- `PATCH /api/auth/profile` - Update user profile
- `POST /api/auth/verify` - Verify Firebase token

### Admin
- `GET /api/admin/users` - Get all users (admin only)
- `PATCH /api/admin/users/:uid/role` - Update user role (admin only)
- `GET /api/admin/dashboard/stats` - Get admin dashboard statistics
- `DELETE /api/admin/users/:uid` - Delete user (admin only)
- `POST /api/admin/issues/bulk-action` - Bulk actions on issues (admin only)

### Export
- `GET /api/export/issues/csv` - Export issues to CSV (admin only)
- `GET /api/export/users/csv` - Export users to CSV (admin only)
- `GET /api/export/stats/report` - Export statistics report (admin only)

## Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment variables**:
   Copy `.env.example` to `.env` and fill in your Firebase and email configuration.

3. **Set up Firebase Admin SDK**:
   - Go to Firebase Console → Project Settings → Service Accounts
   - Generate a new private key
   - Use the credentials in your `.env` file

4. **Start the server**:
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NODE_ENV` | Environment (development/production) | No |
| `PORT` | Server port | No |
| `FRONTEND_URL` | Frontend URL for CORS | No |
| `FIREBASE_PROJECT_ID` | Firebase project ID | Yes |
| `FIREBASE_PRIVATE_KEY` | Firebase private key | Yes |
| `FIREBASE_CLIENT_EMAIL` | Firebase client email | Yes |
| `EMAIL_SERVICE` | Email service provider | No |
| `EMAIL_USER` | Email username | No |
| `EMAIL_PASS` | Email password | No |

## Security Features

- **Authentication**: All protected routes require valid Firebase tokens
- **Authorization**: Role-based access control
- **Rate Limiting**: Prevents API abuse
- **Input Validation**: Validates all user inputs
- **CORS**: Configured for frontend domain
- **Security Headers**: Helmet.js for security headers

## Error Handling

The server includes comprehensive error handling:
- Custom error classes for different error types
- Async error wrapper for catching promise rejections
- Detailed error responses in development
- Sanitized error responses in production

## Testing

Run tests with:
```bash
npm test
```

## Deployment

The server can be deployed to any Node.js hosting platform:
- Heroku
- Railway
- Render
- DigitalOcean App Platform
- AWS Elastic Beanstalk

Make sure to set all required environment variables in your deployment platform.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run tests and ensure they pass
6. Submit a pull request

## License

This project is licensed under the MIT License.
