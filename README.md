# Heaton Employee Directory

A clean, fast employee directory web application for Heaton Eye Associates. Features a mobile-friendly interface with search and location filtering capabilities.

## Features

- **Employee Directory**: Browse all 269 employees with contact information
- **Live Search**: Search by name, title, team, or location with instant results
- **Location Filter**: Filter employees by Tyler, Longview, Athens, or Gun Barrel City
- **Admin Panel**: Upload and manage employee data via CSV import
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **No Authentication Required**: Direct access for all employees

## Tech Stack

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **PapaParse** - CSV import/export
- **Heroicons** - Icon library

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## Deployment

This application is optimized for deployment on Vercel:

1. Push code to GitHub
2. Import repository to Vercel
3. Deploy (no environment variables needed)

## Project Structure

```
src/
├── app/
│   ├── admin/           # Admin panel for CSV management
│   ├── api/employees/   # Employee API routes
│   ├── heaton-directory/ # Alternative directory route
│   └── page.tsx         # Main directory page
├── components/
│   ├── AdminPanel.tsx
│   ├── AppleDirectoryView.tsx
│   └── CSVImport.tsx
├── lib/
│   ├── database.ts      # JSON file storage
│   ├── searchFilter.ts  # Live search functionality
│   └── csvImport.ts     # CSV parsing utilities
└── styles/
    ├── apple-design-system.css
    └── directory-layout.css
```

## Admin Panel

Access the admin panel at `/admin` to:
- Upload new employee data via CSV
- Export current data to CSV
- View employee statistics by location

### CSV Format

The CSV should include these columns:
- Name, Email, Extension, DID, Team, Location, Department, Job Title

## Data Storage

Employee data is stored in `data/employees.json` for simplicity and fast read access. No database setup required.

## License

ISC
