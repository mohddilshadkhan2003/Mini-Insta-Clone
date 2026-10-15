# Mini Insta Clone

A polished full-stack social media application inspired by Instagram, built with React, Express, and SQLite. The project focuses on clean UI, social interactions, profile management, post creation, authentication, and real-time-like user experiences.

[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![Express](https://img.shields.io/badge/Express-4-000000?style=for-the-badge&logo=express)](https://expressjs.com/)
[![SQLite](https://img.shields.io/badge/SQLite-Database-003B57?style=for-the-badge&logo=sqlite)](https://www.sqlite.org/)
[![JWT](https://img.shields.io/badge/JWT-Auth-000000?style=for-the-badge&logo=jsonwebtokens)](https://jwt.io/)
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](LICENSE)

## Overview

Mini Insta Clone is a lightweight social platform that brings together the core features users expect from an Instagram-like experience:

- user authentication and profile management
- feed browsing with follow-based content
- explore and discovery pages
- detailed post views and comments
- post creation with media upload support
- likes, follows, and profile interactions

This project is designed to be easy to run locally, easy to understand, and a strong starting point for building a production-ready social app.

## Live Project

- Repository: https://github.com/mohddilshadkhan2003/Mini-Insta-Clone
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## Tech Stack

### Frontend
- React 18
- React Router
- Axios
- CSS Modules / custom CSS styling

### Backend
- Node.js + Express
- SQLite + better-sqlite3
- JWT authentication
- bcryptjs for password hashing
- multer for image uploads
- dotenv for environment setup

## Features

- Secure signup and login flow
- Personalized social feed
- Explore page with discovery content
- Search users and posts
- Create posts with captions and images
- Like and comment on posts
- Follow/unfollow users
- User profile pages with post collections
- Responsive, modern UI design

## Project Structure

```bash
Mini-Insta-Clone/
├── backend/
│   ├── database/
│   │   └── db.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── upload.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── feed.js
│   │   ├── posts.js
│   │   ├── users.js
│   │   └── explore.js
│   ├── scripts/
│   │   └── seed.js
│   ├── uploads/
│   ├── server.js
│   ├── .env.example
│   ├── package.json
│   └── package-lock.json
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── App.js
│   │   ├── App.css
│   │   ├── index.css
│   │   └── index.js
│   ├── package.json
│   └── package-lock.json
├── README.md
└── .gitignore
```

## Prerequisites

Before you begin, make sure you have the following installed:

- Node.js v18+
- npm
- Git

## Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/mohddilshadkhan2003/Mini-Insta-Clone.git
cd Mini-Insta-Clone
```

### 2. Set up the backend

```bash
cd backend
npm install
```

Create a `.env` file in the `backend` folder:

```env
PORT=5000
JWT_SECRET=your-super-secret-key
```

You can also copy from the example file:

```bash
cp env.example .env
```

Start the backend server:

```bash
npm start
```

Optional demo data:

```bash
npm run seed
```

### 3. Set up the frontend

Open a new terminal window:

```bash
cd frontend
npm install
npm start
```

The frontend will run at:

```text
http://localhost:3000
```

## Demo Accounts

If you seed the database, the app includes demo users such as:

- `alice@example.com` / `password123`
- `bob@example.com` / `password123`
- `charlie@example.com` / `password123`

You can also create your own account through the signup form.

## API Endpoints

### Authentication
- `POST /api/auth/signup`
- `POST /api/auth/login`

### Feed
- `GET /api/feed?page=1`

### Posts
- `POST /api/posts`
- `GET /api/posts/:postId`
- `POST /api/posts/:postId/like`
- `POST /api/posts/:postId/unlike`
- `POST /api/posts/:postId/comment`

### Users
- `GET /api/users/:userId?page=1`
- `POST /api/users/:userId/follow`
- `POST /api/users/:userId/unfollow`

### Explore
- `GET /api/explore/posts?page=1`
- `GET /api/explore/search?q=searchterm`
- `GET /api/explore/suggestions`

## Development Commands

```bash
# Backend
cd backend
npm start
npm run dev
npm run seed

# Frontend
cd frontend
npm start
npm run build
```

## Project Goals

This app demonstrates how to build a social platform using:

- modern frontend architecture
- RESTful backend APIs
- database design and indexing
- efficient feed loading patterns
- user experience-first UI design

## Roadmap

- [ ] Story feature
- [ ] Notifications center
- [ ] Direct messaging
- [ ] Video uploads
- [ ] Real-time updates with WebSockets
- [ ] Production deployment guide
- [ ] PostgreSQL migration

## Troubleshooting

### Port conflicts

If port `5000` or `3000` is already in use, update your environment variable or run the app on another port.

### Database issues

```bash
rm backend/database/instagram.db
cd backend
npm run seed
```

### Missing dependencies

```bash
rm -rf node_modules package-lock.json
npm install
```

## Contributing

Contributions are welcome. If you want to improve the app, feel free to fork the repository and open a pull request.

## License

This project is licensed under the MIT License.

## Author

Built by Mohd Dilshad Khan.

## Support

For bugs, questions, or feature requests, open an issue in this repository.

---

Made with care for a cleaner, more polished social app experience.
