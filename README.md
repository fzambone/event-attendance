# Event Attendance Confirmation App

A simple Next.js application built to manage attendance confirmations for events. Users receive a unique link for an event, confirm their attendance (including the number of guests), and administrators can manage events and view the confirmation list via a password-protected admin panel.

## Features

*   **Event-Specific Confirmation Pages:** Unique URLs for each event (e.g., `/confirm/your-event-slug`).
*   **Admin Dashboard:**
    *   Login protected by password.
    *   Create new events with unique slugs/IDs.
    *   View a list of all created events.
    *   Select an event to view its details and confirmations.
    *   See total confirmed guests for an event.
    *   Edit or delete individual confirmations.
    *   Delete entire events (including all associated confirmations).
    *   Manually refresh the confirmation list.
*   **Data Persistence:** Uses Vercel Postgres for storing event and confirmation data.

## Technology Stack

*   [Next.js](https://nextjs.org/) (App Router)
*   [React](https://reactjs.org/)
*   [TypeScript](https://www.typescriptlang.org/)
*   [Tailwind CSS](https://tailwindcss.com/)
*   [Vercel Postgres](https://vercel.com/storage/postgres)
*   [Heroicons](https://heroicons.com/) (for icons)
*   Deployed on [Vercel](https://vercel.com/)

## Getting Started

### Prerequisites

*   Node.js (v18 or later recommended)
*   npm or yarn
*   A Vercel account (for Vercel Postgres access and deployment)

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd <repository-directory>
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

### 3. Set Up Environment Variables

*   **Create Vercel Postgres Database:** Go to your Vercel dashboard, create a new Postgres database, and connect it to your project (or create it standalone).
*   **Copy Environment Variables:** From the Vercel Postgres database settings ("Connect" tab), copy the required environment variables (`POSTGRES_URL`, `POSTGRES_PRISMA_URL`, `POSTGRES_URL_NON_POOLING`, etc.).
*   **Create `.env` file:** Copy the `.env.example` file to a new file named `.env` in the project root.
    ```bash
    cp .env.example .env
    ```
*   **Populate `.env`:** Paste the Vercel Postgres variables into your `.env` file. Also, set a secure `ADMIN_PASSWORD` for accessing the admin dashboard.

    ```dotenv
    # Vercel Postgres Connection (Values from Vercel Dashboard)
    POSTGRES_URL="..."
    POSTGRES_PRISMA_URL="..."
    POSTGRES_URL_NON_POOLING="..."
    POSTGRES_URL_NO_SSL="..."
    POSTGRES_USER="..."
    POSTGRES_HOST="..."
    POSTGRES_PASSWORD="..."
    POSTGRES_DATABASE="..."

    # Admin Login
    ADMIN_PASSWORD="your_very_secure_password_here"
    ```
    **Important:** The `.env` file should be added to your `.gitignore` and never committed to version control.

### 4. Set Up Database Schema

Connect to your Vercel Postgres database using the Vercel dashboard's Query editor or a compatible SQL client. Run the following SQL commands **once** to create the necessary tables:

```sql
-- Create the Events table
CREATE TABLE events (
    id TEXT PRIMARY KEY, -- The unique slug/identifier for the event (e.g., 'feijoada-dos-zambones')
    name TEXT NOT NULL,
    date TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create the Confirmations table
CREATE TABLE confirmations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- Automatically generate a unique ID
    event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE, -- Link to the event, cascade delete
    name TEXT NOT NULL,
    guests INTEGER NOT NULL CHECK (guests >= 1),
    confirmed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Optional: Add an index for faster lookups by event_id
CREATE INDEX idx_confirmations_event_id ON confirmations(event_id);
```

### 5. Run the Development Server

```bash
npm run dev
# or
yarn dev
```

The application should now be running at `http://localhost:3000`.
*   Admin login: `http://localhost:3000/admin/login`
*   Admin dashboard: `http://localhost:3000/admin/attendance`
*   Example confirmation page (replace with a valid event ID): `http://localhost:3000/confirm/your-event-id`

## Deployment

This application is designed for easy deployment to Vercel.

1.  **Push to Git:** Ensure your code is pushed to a Git repository (GitHub, GitLab, Bitbucket) connected to your Vercel account.
2.  **Vercel Project Setup:**
    *   Import your Git repository into Vercel.
    *   Vercel should automatically detect it as a Next.js project.
3.  **Connect Vercel Postgres:** Ensure the Vercel Postgres database created earlier is connected to this Vercel project (Storage tab).
4.  **Set Environment Variables:** In your Vercel project settings (Settings -> Environment Variables), add the **same** environment variables as in your local `.env` file:
    *   `ADMIN_PASSWORD`
    *   All `POSTGRES_*` variables (these might be automatically injected if the database is linked correctly, but verify they are present and set for **Production**).
5.  **Deploy:** Vercel will automatically build and deploy your project when you push changes to the connected branch (usually `main` or `master`).

## Disclaimer

Please note: This project was developed rapidly as a personal utility to fulfill a specific, immediate need. While it follows some basic web development conventions and aims for functional correctness, it was not built with the rigor or architectural considerations typical of enterprise-level software. It does not strictly adhere to principles like SOLID and may lack comprehensive error handling, testing, or advanced security measures. This project is **not** intended as a representation of my professional expertise or capabilities in building complex, robust applications for production environments.
