

# 🎵 Music Marketplace

A full-stack music platform where users can upload, share, and monetize audio content such as songs, beats, and loops.

This project is currently in active development and focuses on building a modern music-sharing and marketplace experience inspired by platforms like Splice, SoundCloud, and BeatStars.

---

## 🚀 Features (Current)

### 🔐 Authentication
- User registration and login
- Secure session-based authentication (cookies)
- Logout functionality
- Guest users can browse and listen

### 🎧 Music Feed
- Homepage displays all uploaded tracks
- Real audio playback with waveform visualization (WaveSurfer)
- Only one track plays at a time across the feed
- Clickable waveform + progress bar
- Relative time display ("2 days ago", "3 months ago")

### 🎼 Track System
- Upload `.mp3` and `.wav` files
- Track metadata stored in PostgreSQL via Prisma
- Track types supported:
  - Song
  - Beat
  - Loop
  - Sample
  - Stem
  - Vocal
  - Drumkit
- Tag displayed on each track (e.g. `#Song`, `#Beat`)

### 💰 Marketplace Foundation
- Point system (stored on User model)
- "Support" button for songs
- "Buy (points)" button for beats
- Foundation for future monetization

### 👤 User System
- User profiles (channels)
- Dynamic channel pages (`/channel/[userId]`)
- View own or other users' uploaded tracks
- Planned: unique user handles (`/@username`)

### 💬 Song View Page
- Dedicated page per track (`/song/[trackId]`)
- Shows:
  - Artist
  - Title
  - Description
  - Audio player
  - Comments section (schema ready)

### 🧭 Navigation UI
- Top navigation bar
- Sidebar navigation
- Profile dropdown
- Points counter (placeholder)

---

## 🛠️ Tech Stack

### Frontend
- Next.js (App Router)
- React
- Tailwind CSS
- WaveSurfer.js (waveform rendering)
- Lucide Icons

### Backend
- Next.js API Routes
- Prisma ORM
- PostgreSQL

### Other
- UUID for file naming
- Local file storage (`/public/uploads`)

---

## 📁 Project Structure (Simplified)

```
app/
  api/
    login/
    logout/
    register/
    upload/
  channel/[userId]/
  song/[trackId]/
  components/
    NavigationBar.tsx
    TrackFeedItem.tsx
    TrackFeedList.tsx

lib/
  prisma.ts
  auth.ts

prisma/
  schema.prisma
```

---

## ⚙️ Setup Instructions

### 1. Install dependencies

```bash
npm install
```

### 2. Setup environment variables

Create a `.env` file:

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/music_marketplace"
```

### 3. Run Prisma migrations

```bash
npx prisma migrate dev
npx prisma generate
```

### 4. Start development server

```bash
npm run dev
```

---

## 🧠 Future Features

- 🔑 Unique user handles (`/@username`)
- ❤️ Like system
- 💬 Full comment posting
- 📦 Purchase system with point deduction
- 🎚️ Upload stems & unlock after purchase
- 🧾 Order history
- 👥 Follow system
- 🎨 Cover image upload
- 🔍 Search & filtering (by track type)
- 🎵 Global music player (Spotify-style)

---

## 📌 Notes

- This project is currently using **local file storage** for uploads
- Database is currently local (PostgreSQL)
- Designed for future migration to cloud storage and hosted DB

---

## 👨‍💻 Author

**Vorahpong Mean**

Computer Science Student @ Cameron University

---

## ⭐ Status

🚧 In Progress — building core features and marketplace system