# 🖼️ Mini-Insta-Clone

A high-performance Instagram clone built with **React**, **Express**, and **SQLite** featuring optimized database queries, pagination, and real-time interactions.

## ✨ Features

- 🔐 **Authentication** - Secure JWT-based signup and login
- 📱 **Home Feed** - View posts from followed users with pagination
- 🔍 **Explore** - Discover new posts with infinite scroll
- 🔎 **Search** - Find users and posts instantly
- 📸 **Create Posts** - Upload images with captions
- ❤️ **Like/Unlike** - Instant feedback without page refresh
- 💬 **Comments** - Add and view comments on posts
- 👥 **Follow/Unfollow** - Build your network
- 👤 **User Profiles** - View user info and their posts with pagination

## ⚡ Performance Optimizations

- ✅ **11 Database Indexes** - Eliminates table scans
- ✅ **N+1 Query Fixes** - 40+ queries reduced to 2-3 per request
- ✅ **Pagination** - All endpoints support page-based pagination
- ✅ **Lazy Loading** - Images load on scroll
- ✅ **Optimized State Updates** - Like/unlike updates local state instantly
- ✅ **React Memoization** - useCallback prevents unnecessary re-renders

---

## 🏗️ Project Structure

```
Mini-Insta-Clone/
├── backend/
│   ├── database/
│   │   └── db.js              (Database setup + indexes)
│   ├── middleware/
│   │   ├── auth.js            (JWT authentication)
│   │   └── upload.js          (Image upload config)
│   ├── routes/
│   │   ├── auth.js            (Login/Signup)
│   │   ├── feed.js            (Optimized feed with pagination)
│   │   ├── posts.js           (Create/like posts)
│   │   ├── users.js           (User profiles)
│   │   └── explore.js         (Optimized explore + search)
│   ├── scripts/
│   │   └── seed.js            (Database seeder)
│   ├── uploads/               (Uploaded images)
│   ├── server.js              (Express server)
│   ├── package.json
│   └── .env                   (Environment variables)
│
└── frontend/
    ├── src/
    │   ├── pages/
    │   │   ├── HomeFeed.js     (Optimized with pagination)
    │   │   ├── Explore.js      (Optimized with lazy loading)
    │   │   ├── CreatePost.js
    │   │   ├── Profile.js
    │   │   ├── PostDetail.js
    │   │   ├── Search.js
    │   │   ├── Login.js
    │   │   └── Signup.js
    │   ├── components/
    │   ├── context/
    │   │   └── AuthContext.js  (Auth state management)
    │   ├── App.js
    │   └── index.js
    ├── package.json
    └── .env (if needed)
```

---

## 📋 Prerequisites

- **Node.js** (v14 or higher) - [Download](https://nodejs.org/)
- **npm** (comes with Node.js)
- **Git** (to clone the repo)

---

## 🚀 Quick Start

### Step 1: Clone the Repository

```bash
git clone https://github.com/mohddilshadkhan61816-lab/Mini-Insta-Clone.git
cd Mini-Insta-Clone
```

---

### Step 2: Backend Setup

Open **Terminal 1**:

```bash
# Navigate to backend folder
cd backend

# Install dependencies
npm install

# Create .env file
# For Mac/Linux:
cat > .env << EOF
PORT=5000
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
EOF

# For Windows (PowerShell):
# Create a file named .env in the backend folder with:
# PORT=5000
# JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

#### (Optional) Seed the Database with Demo Data

```bash
npm run seed
```

**Demo Accounts** (from seeded data):
```
Celebrity Accounts:
  iamsrk: Email: shahrukh@gmail.com, Password: shahrukh@123
  amitabhbachchan: Email: amitabh@gmail.com, Password: amitabh@123
  akshaykumar: Email: akshay@gmail.com, Password: akshay@123
  ... and more

Demo Accounts (password: password123):
  alice_wonder: alice@example.com
  bob_photographer: bob@example.com
  charlie_travel: charlie@example.com
  diana_fashion: diana@example.com
  ... and more
```

#### Start the Backend Server

```bash
npm start
```

✅ You should see:
```
Server running on port 5000
Database initialized successfully with indexes
```

Backend is now running at: **http://localhost:5000**

---

### Step 3: Frontend Setup

Open **Terminal 2** (keep Terminal 1 running):

```bash
# Navigate to frontend folder
cd frontend

# Install dependencies
npm install

# Start the React development server
npm start
```

✅ The app will automatically open at: **http://localhost:3000**

---

## 🧪 Test the Application

### Create a New Account or Login

1. **Sign Up**: Click "Sign Up" and create a new account
   ```
   Username: testuser (min 3 characters)
   Email: test@example.com
   Password: password123 (min 6 characters)
   ```

2. **Login**: Use the email and password you just created

3. **Or use demo account** (if you seeded the database):
   ```
   Email: alice@example.com
   Password: password123
   ```

### Features to Test

✅ **Home Feed** - View posts from users you follow
✅ **Explore** - Discover posts with pagination
✅ **Search** - Search for users and posts
✅ **Create Post** - Upload images with captions
✅ **Like/Unlike** - Instant like updates (no page refresh)
✅ **Comment** - Add comments to posts
✅ **Follow/Unfollow** - Follow other users
✅ **User Profile** - View user info and their posts

---

## 📡 API Endpoints

### Authentication
- `POST /api/auth/signup` - Create account
- `POST /api/auth/login` - Login

### Feed
- `GET /api/feed?page=1` - Get home feed with pagination

### Posts
- `POST /api/posts` - Create post (with image)
- `GET /api/posts/:postId` - Get post details
- `POST /api/posts/:postId/like` - Like a post
- `POST /api/posts/:postId/unlike` - Unlike a post
- `POST /api/posts/:postId/comment` - Add comment

### Users
- `GET /api/users/:userId?page=1` - Get user profile with pagination
- `POST /api/users/:userId/follow` - Follow user
- `POST /api/users/:userId/unfollow` - Unfollow user

### Explore
- `GET /api/explore/posts?page=1` - Get explore posts with pagination
- `GET /api/explore/search?q=searchterm` - Search users and posts
- `GET /api/explore/suggestions` - Get follow suggestions

---

## 🛠️ Commands Quick Reference

```bash
# Backend
cd backend
npm install              # Install dependencies
npm start               # Start server (port 5000)
npm run seed            # Seed database with demo data
npm run dev             # Run with nodemon (auto-reload)

# Frontend
cd frontend
npm install              # Install dependencies
npm start               # Start app (port 3000)
npm build               # Build for production
npm test                # Run tests
```

---

## 🐛 Troubleshooting

### **Port Already in Use**
```bash
# If port 5000 is already in use, change in .env:
PORT=5001

# If port 3000 is already in use, run frontend with:
PORT=3001 npm start
```

### **Database Issues**
```bash
# Clear the database and reseed:
rm backend/database/instagram.db
cd backend
npm run seed
```

### **"Cannot find module" errors**
```bash
# Delete node_modules and reinstall:
rm -rf node_modules package-lock.json
npm install
```

### **CORS Errors**
- Make sure backend is running on port 5000
- Make sure frontend is running on port 3000
- Check that the API URLs in frontend match the backend port

### **Images Not Loading**
- Check that `backend/uploads/` folder exists
- Verify image URLs use `http://localhost:5000` prefix
- Check browser console for 404 errors

---

## 📊 Performance Comparison

| Metric | Before Optimization | After Optimization |
|--------|--------------------|--------------------|
| Feed Load Queries | 40+ per request | 2-3 per page |
| Explore Queries | 100+ per request | 1-2 per page |
| Image Loading | All at once | Lazy loaded |
| Like/Unlike | Full feed refresh | Local state update |
| Database Scans | High (no indexes) | Eliminated (indexed) |
| Page Load Time | ~2-3 seconds | ~500-700ms |

---

## 🔧 Technology Stack

### Backend
- **Express.js** - Web framework
- **SQLite + better-sqlite3** - Lightweight database
- **bcryptjs** - Password hashing
- **jsonwebtoken** - JWT authentication
- **multer** - File uploads
- **dotenv** - Environment variables

### Frontend
- **React 18** - UI library
- **React Router** - Navigation
- **Axios** - HTTP client
- **Context API** - State management

---

## 📈 Future Improvements

- [ ] Notifications system
- [ ] Direct messaging
- [ ] Stories feature
- [ ] Video uploads
- [ ] Real-time updates with WebSockets
- [ ] Mobile app with React Native
- [ ] Production deployment guide
- [ ] PostgreSQL migration guide

---

## 📝 License

This project is open source and available under the MIT License.

---

## 🤝 Contributing

Contributions are welcome! Feel free to fork this repository and submit pull requests.

---

## 📞 Support

For issues or questions, please open a GitHub issue or contact the maintainer.

---

**🎉 Happy coding! Enjoy using Mini-Insta-Clone!**
