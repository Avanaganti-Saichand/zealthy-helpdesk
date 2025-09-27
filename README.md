# Zealthy Helpdesk

Frontend Demo: https://zealthy-helpdesk-swart.vercel.app/
Backend API: https://zealthy-helpdesk-m8le.onrender.com
Repository: https://github.com/Avanaganti-Saichand/zealthy-helpdesk

## Overview

Zealthy Helpdesk is a simple support ticket management system created as a coding exercise. It provides:

1. A user-facing flow to submit support tickets with optional image attachments.
2. An admin panel to review tickets, preview attachments, update statuses, and send responses.

The project demonstrates a full-stack solution with a React Native (Expo) frontend and an Express + SQLite backend, deployed online for demo purposes.

## Features

### User (Submit)

- Submit a ticket with: name, email, description, and optional photo
- Client-side validation (required fields, email format, description length)
- Clear success and error alerts

### Admin

- See a scrollable list of tickets with status badges
- Open a ticket to view details and preview the uploaded image
- Update status using a dropdown: new, in_progress, resolved
- Add an admin response
- Confirmation popup after saving changes (e.g., “Status changed to …”)

## Technology Stack

- Frontend: React Native with Expo (Web), Expo Router, @react-native-picker/picker
- Backend: Node.js + Express
- Database: SQLite via better-sqlite3
- Uploads: Multer, served statically from /uploads
- Hosting: Vercel (Frontend), Render (Backend)

## Live Demo

1. Open the Frontend Demo link above.
2. Submit a new ticket (optionally attach an image).
3. Open the Admin tab, refresh the list, open your ticket, and update its status/response.
4. Attachment links are served from the backend /uploads path.

Note: On the first request, free-tier hosting may be “cold”. If an image or API call doesn’t load immediately, reload once.

## Running Locally

### Backend

```bash
cd backend
npm install
node server.js
```

Backend will run at: http://localhost:4000

Health check:

```bash
curl http://localhost:4000/api/health
```

### Frontend (Web)

```bash
cd frontend/zealthy-helpdesk
npm install
npm start
```

Press “w” to open Web in your browser.

Testing from a phone on the same Wi‑Fi: set API_BASE in the code to your PC’s LAN IP, e.g. http://192.168.1.23:4000

## API Endpoints

Base URL (production): https://zealthy-helpdesk-m8le.onrender.com

| Method | Endpoint         | Description                                                                                    |
| -----: | ---------------- | ---------------------------------------------------------------------------------------------- | ----------- | ---------------------------------- |
|    GET | /api/health      | Health check, returns `{ ok: true }`.                                                          |
|   POST | /api/tickets     | Create ticket. multipart/form-data with `name`, `email`, `description`, optional `attachment`. |
|    GET | /api/tickets     | List all tickets.                                                                              |
|    GET | /api/tickets/:id | Get a single ticket.                                                                           |
|  PATCH | /api/tickets/:id | Update `status` (new                                                                           | in_progress | resolved) and/or `admin_response`. |

Uploads are served at:

```
https://<backend-domain>/uploads/<filename>
```

## Project Structure

```
zealthy-helpdesk/
├─ backend/
│  ├─ server.js               # Express API + SQLite + Multer uploads
│  ├─ helpdesk.db             # SQLite database (auto-created)
│  └─ uploads/                # Uploaded images (served statically)
└─ frontend/
   └─ zealthy-helpdesk/
      └─ app/(tabs)/
         ├─ index.js          # Submit screen (user)
         └─ admin.js          # Admin screen
```

## Notes and Assumptions

- Email notifications are not sent; actions are logged (e.g., “Would normally send email here with body: …”), per the exercise instructions.
- Attachment size is limited to 10 MB.
- No authentication is implemented for the admin panel in this version.
- The design aims to be simple, clear, and easy to navigate.

## Future Improvements

- Authentication and role-based access control for Admin
- Cloud storage for attachments (e.g., AWS S3)
- Search and filtering by status/text on the Admin list
- Pagination or infinite scroll for large datasets
- Real email notifications
- Additional UI/UX polish

## Submission Contacts

- travante.richardson@getzealthy.com
- shantibraford@gmail.com

## Author

Saichand Avanaganti
Email: saichand98498@gmail.com
GitHub: https://github.com/Avanaganti-Saichand
