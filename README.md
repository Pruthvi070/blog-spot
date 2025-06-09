# Blog-Spot

A modern, full-stack blogging platform built with React and Node.js that allows users to create, read, and manage blog posts.

## Features

- **User Authentication**
  - Secure login and registration system
  - Password reset functionality
  - JWT-based authentication
  - Session management

- **Blog Management**
  - Create, edit, and delete blog posts
  - Rich text editor for content creation
  - Image upload support
  - Category-based organization
  - Search functionality

- **User Features**
  - User profiles
  - Personal dashboard
  - Post management
  - Category management

- **Public Access**
  - View blogs without authentication
  - Search and filter posts
  - Category-based navigation
  - Responsive design for all devices

## Tech Stack

### Frontend
- React.js
- React Router for navigation
- CSS Modules for styling
- Axios for API requests

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- JWT for authentication
- Nodemailer for email services

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone https://github.com/GuruprasadLokhande/Blog-Spot.git
cd Blog-Spot
```

2. Install dependencies:
```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../public
npm install
```

3. Environment Setup:
   - Create a `.env` file in the server directory
   - Add the following environment variables:
```
PORT=5000
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
EMAIL_USER=your_email
EMAIL_PASS=your_email_password
LOGIN_EXPIRES=604800
```

4. Start the application:
```bash
# Start the server (from server directory)
npm start

# Start the client (from public directory)
npm start
```

## Project Structure

```
Blog-Spot/
├── server/                 # Backend code
│   ├── controller/        # Route controllers
│   ├── middleware/        # Custom middleware
│   ├── models/           # Database models
│   ├── routes/           # API routes
│   └── utils/            # Utility functions
│
└── public/                # Frontend code
    ├── src/
    │   ├── components/   # React components
    │   ├── pages/        # Page components
    │   └── utils/        # Utility functions
    └── package.json
```

## API Endpoints

### Public Routes
- `GET /public/getpost` - Get all posts
- `GET /public/getcategory` - Get all categories

### Protected Routes
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/forgotpassword` - Password reset request
- `POST /auth/resetpassword` - Reset password
- `GET /profile/getprofile` - Get user profile
- `POST /profile/updateprofile` - Update user profile
- `POST /profile/createpost` - Create new post
- `GET /profile/getpost` - Get user's posts
- `PUT /profile/updatepost` - Update post
- `DELETE /profile/deletepost` - Delete post
- `POST /profile/createcategory` - Create category
- `GET /profile/getcategory` - Get categories
- `PUT /profile/updatecategory` - Update category
- `DELETE /profile/deletecategory` - Delete category

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contact

Guruprasad Lokhande - lokhandeguru03@gmail.com

Project Link: [https://github.com/GuruprasadLokhande/Blog-Spot](https://github.com/GuruprasadLokhande/Blog-Spot)