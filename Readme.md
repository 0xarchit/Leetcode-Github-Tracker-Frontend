# Student Tracker - GitHub & LeetCode Dashboard

A professional, high-performance dashboard for teachers and administrators to monitor student progress across GitHub and LeetCode. Built with a modern tech stack for a fast, responsive, and app-like user experience.

Backend Repo: https://github.com/0xarchit/Leetcode-Github-Tracker-Backend

## Overview

This frontend application provides a centralized interface to track and visualize student performance data fetched from a custom backend API. It's designed for educational environments where monitoring coding activity is crucial. The dashboard is optimized for both desktop and mobile use and is installable as a Progressive Web App (PWA).

## ✨ Key Features

- **Comprehensive Dashboard**: View sortable, searchable, and paginated tables of student data for different classes.
- **Detailed Student Insights**: Click on any student to open detailed modals for their GitHub and LeetCode statistics, including contribution history, repositories, problem-solving stats, and streaks.
- **Student Comparison**: Select 2-3 students to compare their key metrics side-by-side, including activity charts over various time ranges (7d, 30d, 1y, etc.).
- **Stats Workspace (/stats)**: Pick any class, adjust the top-N (up to 15) students, and explore GitHub-only, LeetCode-only, and blended charts alongside a 16-metric comparison grid for the last 30 days.
- **Multi-Class Support**: Seamlessly switch between different class datasets or view all students at once (with efficient cache-first loading).
- **Admin Controls**: A settings panel allows for forcing database updates, clearing cached data, and viewing system status.
- **PWA Ready**: Fully installable on desktop and mobile for a native app experience, with offline capabilities.
- **Modern UI/UX**: Built with Shadcn/UI and Tailwind CSS, featuring a sleek, responsive design with light/dark mode support.
- **Secure Authentication**: User authentication is handled via Supabase, with routes protected and a dedicated auth page.
- **Public Pages**: A read-only view for specific classes can be shared publicly via a unique URL.

## 🛠️ Tech Stack

- **Framework**: [React](https://reactjs.org/) (with [Vite](https://vitejs.dev/))
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **UI Components**: [Shadcn/UI](https://ui.shadcn.com/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **State Management**: [TanStack Query (React Query)](https://tanstack.com/query/latest) for server state, caching, and data fetching.
- **Routing**: [React Router](https://reactrouter.com/)
- **Charting**: [Recharts](https://recharts.org/)
- **Authentication & Backend**: [Supabase](https://supabase.io/) (for auth and as a backend service)
- **PWA**: [Vite PWA Plugin](https://vite-pwa-org.netlify.app/)

## 📂 Project Structure

The `src` directory is organized by feature and responsibility:

```
src/
├── components/
│   ├── auth/         # AuthPage, PasswordUpdate
│   ├── dashboard/    # Main dashboard components (Table, Modals, Nav)
│   └── ui/           # Re-usable UI components from Shadcn
├── contexts/         # React contexts (e.g., AuthContext)
├── hooks/            # Custom hooks (e.g., use-mobile)
├── integrations/     # Supabase client setup
├── lib/              # Utility functions
├── pages/            # Top-level page components (NotFound, PublicClass)
├── services/         # API service layer and cache management
└── version.ts        # Centralized app version
```

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [pnpm](https://pnpm.io/) (or npm/yarn)

### 1. Clone the repository

```bash
git clone https://github.com/0xarchit/Leetcode-Github-Tracker-Frontend.git
cd Leetcode-Github-Tracker-Frontend
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Set up environment variables

Create a `.env.local` file in the root of the project and add the following variables. These are required to connect to the Supabase project and the backend API.

```env
# URL to your backend API that serves student data
VITE_API_BASE_URL=https://your-backend-api-url.com

# Supabase credentials for authentication
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 4. Run the development server

```bash
pnpm dev
```

The application will be available at `http://localhost:3000`.

### 5. Build for production

To create a production-ready build:

```bash
pnpm build
```

The output will be in the `dist/` directory and can be served with any static file server.

## Deployment

The project is configured for easy deployment on static hosting platforms like Vercel, Netlify, or GitHub Pages. The `pnpm build` command generates a fully optimized and static `dist` folder ready for serving.

## 🤝 Contributing

Contributions are welcome! Please feel free to open an issue or submit a pull request.

1.  Fork the repository.
2.  Create your feature branch (`git checkout -b feature/AmazingFeature`).
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4.  Push to the branch (`git push origin feature/AmazingFeature`).
5.  Open a Pull Request.

## 👨‍💻 Developer

- **Archit** - [0xArchit](https://github.com/0xarchit)
