# Smart Mess System - T.J.S Engineering College

A comprehensive mess management system built with the MERN stack, featuring QR-based token generation, real-time validation, and role-based dashboards for students, supervisors, and administrators.

## 🚀 Features

### Student Portal
- **Digital Access Pass**: Generate time-limited QR tokens for meal access
- **Active Token Popup**: View full-size QR code with countdown timer
- **Token History Navigation**: Browse through past meal tokens with arrow navigation
- **Meal History**: Track all meal transactions with status indicators
- **Keyboard Support**: Navigate history using arrow keys

### Supervisor Dashboard
- **QR Scanner**: Real-time QR code scanning with camera integration
- **Instant Validation**: Verify student tokens with immediate feedback
- **Scan History**: View all scanned tokens with timestamps

### Admin Dashboard
- **User Management**: Create, view, and manage students, supervisors, and guests
- **Department Organization**: Group students by department and year
- **Dining Logs**: Comprehensive meal transaction history
- **Statistics**: Real-time metrics on system usage
- **Hierarchical Navigation**: Drill-down from departments to years to students

### Design & UX
- **MNC-Level UI**: Enterprise-grade design with premium aesthetics
- **Fully Responsive**: Optimized for mobile, tablet, and desktop
- **Dark Theme**: Professional slate color palette
- **Smooth Animations**: Micro-interactions for enhanced UX
- **Accessibility**: ARIA-compliant with keyboard navigation

## 🛠️ Tech Stack

### Frontend
- **React 19** - UI framework
- **Material-UI (MUI) v7** - Component library
- **React Router v7** - Client-side routing
- **Axios** - HTTP client
- **QRCode.react** - QR code generation
- **@yudiel/react-qr-scanner** - QR code scanning
- **Vite** - Build tool

### Backend
- **Node.js** - Runtime environment
- **Express v5** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **QRCode** - Server-side QR generation

## 📦 Installation

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file (see `.env.example` for reference):
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/smartmess
JWT_SECRET=your_jwt_secret_key_here
FRONTEND_URL=http://localhost:5173
```

4. Seed the database (creates admin user and sample data):
```bash
node seeder.js
```

5. Start the server:
```bash
npm start
# or for development with auto-reload
nodemon server
```

The backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

## 🔐 Default Credentials

After running the seeder, use these credentials to log in:

**Admin:**
- Email: `admin@test.com`
- Password: `admin123`

**Student:**
- Email: `student@test.com`
- Password: `student123`

**Supervisor:**
- Email: `supervisor@test.com`
- Password: `supervisor123`

## 📁 Project Structure

```
smartmess/
├── backend/
│   ├── controllers/      # Route handlers
│   ├── middleware/       # Auth & validation
│   ├── models/          # Mongoose schemas
│   ├── routes/          # API routes
│   ├── server.js        # Entry point
│   └── seeder.js        # Database seeder
│
├── frontend/
│   ├── public/          # Static assets
│   └── src/
│       ├── components/  # Reusable components
│       ├── context/     # React context (Auth)
│       ├── pages/       # Route pages
│       ├── utils/       # API client
│       ├── theme.js     # MUI theme config
│       └── App.jsx      # Main app component
│
└── Readme.md
```

## 🔄 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Student Routes
- `GET /api/student/generate-qr` - Generate meal token
- `GET /api/student/history` - Get meal history

### Supervisor Routes
- `POST /api/supervisor/scan` - Validate QR token
- `GET /api/supervisor/logs` - Get scan history

### Admin Routes
- `GET /api/admin/users` - Get all users
- `POST /api/admin/users` - Create new user
- `GET /api/admin/logs` - Get all dining logs
- `GET /api/admin/stats` - Get system statistics

## 🎨 Design System

### Color Palette
- **Primary**: Slate 900 (#0F172A)
- **Secondary**: Blue 600 (#2563EB)
- **Background**: Slate 100 (#F1F5F9)
- **Success**: Emerald 500 (#10B981)
- **Error**: Red 500 (#EF4444)

### Typography
- **Font Family**: Inter
- **Headings**: 600-700 weight
- **Body**: 400-500 weight

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcryptjs
- Protected API routes with middleware
- Token expiration (5 minutes for QR codes)
- Role-based access control

## 📱 Responsive Breakpoints

- **Mobile**: < 600px (xs)
- **Tablet**: 600px - 960px (sm, md)
- **Desktop**: > 960px (lg, xl)

## 🚦 Token Expiration Logic

Tokens automatically expire based on meal times:
- **Breakfast**: Until 10:00 AM
- **Lunch**: 12:00 PM - 02:00 PM
- **Dinner**: 06:30 PM - 10:00 PM

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License.

## 👥 Authors

T.J.S Engineering College - Smart Mess System Team


## 🚀 Deployment

### Backend Deployment (Render)

1. **Push your code to GitHub**
   ```bash
   git add .
   git commit -m "Add deployment configuration"
   git push origin main
   ```

2. **Create a new Web Service on Render**
   - Go to [Render Dashboard](https://dashboard.render.com/)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Render will automatically detect the `render.yaml` file

3. **Set Environment Variables in Render**
   - Go to your service → Environment
   - Add the following variables:
     - `MONGODB_URI`: Your MongoDB connection string
     - `JWT_SECRET`: A strong secret key for JWT
     - `FRONTEND_URL`: Your Vercel frontend URL (e.g., `https://your-app.vercel.app`)
   - `NODE_ENV` and `PORT` are already configured in `render.yaml`

4. **Deploy**
   - Render will automatically deploy your backend
   - Note your backend URL (e.g., `https://your-backend.onrender.com`)

### Frontend Deployment (Vercel)

1. **Create a new Project on Vercel**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "Add New" → "Project"
   - Import your GitHub repository

2. **Configure Build Settings**
   - Vercel will automatically detect the `vercel.json` configuration
   - Framework Preset: Vite
   - Root Directory: `./` (leave as default)

3. **Set Environment Variables in Vercel**
   - Go to Project Settings → Environment Variables
   - Add the following variable:
     - `VITE_API_URL`: Your Render backend URL + `/api` (e.g., `https://your-backend.onrender.com/api`)

4. **Deploy**
   - Click "Deploy"
   - After deployment, copy your Vercel URL

5. **Update Backend FRONTEND_URL**
   - Go back to Render
   - Update the `FRONTEND_URL` environment variable with your Vercel URL
   - Redeploy the backend service

### Important Notes

- **Free Tier Limitations**: Render's free tier may spin down after inactivity. The first request after inactivity may take 30-60 seconds.
- **Environment Variables**: Never commit `.env` files to Git. Use `.env.example` as a reference.
- **CORS**: The backend is configured to accept requests only from the `FRONTEND_URL` you specify.

## 🙏 Acknowledgments

- Material-UI for the component library
- React QR Scanner for camera integration
- MongoDB for the database solution
