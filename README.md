# 📝 Digital Journal App

A modern, feature-rich digital journaling web application built with **Next.js**, **Supabase**, and **Tailwind CSS**. Designed to help users document, reflect on, and manage their daily lives through journaling, tagging, mood tracking, and productivity tools.

---

## 🚀 Features

- ✍️ **Journaling Module**  
  Create, read, update, and delete journal entries. Supports custom tags, mood selection (emoji-based), and favorite entries.

- 🏷️ **Tag Management**  
  Add, edit, and remove tags with duplication prevention and smart suggestions.

- 😊 **Mood Tracker**  
  Select moods for each entry and view mood trends over time.

- 📊 **Dashboard**  
  Real-time statistics: entry count, word count, tag usage, and journaling streaks.

- ✅ **To-Do List Module**  
  Manage tasks with deadlines, completion indicators, and visual progress bars.

- 🗒️ **Quick Notes**  
  Take and manage short notes independently from journal entries.

- 🔍 **Filtering & Search**  
  Filter entries by keyword, tag, mood, date range, and favorites.

- 📤 **Data Export**  
  Export journal data to JSON, CSV, TXT, Markdown, or PDF formats.

- 🌐 **Responsive Design**  
  Built with Tailwind CSS and glassmorphism-inspired UI for a seamless experience across devices.

- 🔐 **Authentication & Security**  
  Supabase handles user authentication and secure data storage using PostgreSQL.

---

## 🛠️ Technologies Used

- **Frontend**: Next.js (React), Tailwind CSS  
- **Backend & Auth**: Supabase (PostgreSQL, Auth)  
- **Export**: JavaScript Blob API  
- **Deployment**: [Vercel](https://jornal-app-zeta.vercel.app/)

---

## 📸 Screenshots

> _Coming Soon — Add screenshots or GIFs showing key features like journaling, mood tracker, dashboard, and export functionality._

---

## 🔧 Getting Started

### 1. Clone this repository
```bash
git clone (https://github.com/Fannysbth/jornal-app)
```
### 2. Install dependencies
```bash
npm install
```
### 3. Set up environment variables
Create a .env.local file and add your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```
### 4. Run the development server
```bash
npm run dev
```
