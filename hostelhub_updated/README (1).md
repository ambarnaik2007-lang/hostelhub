# HostelPass – Digital Hostel Outpass Management System

## How to open and run this in VS Code

1. Install **Node.js** (version 20 or newer) from https://nodejs.org
2. Install **VS Code** from https://code.visualstudio.com
3. Unzip this folder, then in VS Code choose **File → Open Folder…** and pick the `hostelpass` folder.
4. Open the terminal in VS Code (**Terminal → New Terminal**) and run:

   ```sh
   npm install
   npm run dev
   ```

5. Open the address shown in the terminal (usually http://localhost:8080 or http://localhost:3000) in your browser.

Other commands:

| Command          | What it does                                  |
|------------------|-----------------------------------------------|
| `npm run dev`    | Start the website on your computer            |
| `npm run build`  | Make a production build                       |
| `npm test`       | Run the automatic tests for the outpass rules |

Recommended VS Code extensions: **ES7+ React snippets**, **Tailwind CSS IntelliSense**, **Prettier**, **ESLint**.

Demo logins (password `Demo123!` for all):
- Student: student@hostelpass.demo
- Admin / Warden: admin@hostelpass.demo
- Security: security@hostelpass.demo

Data is saved in the browser (localStorage), so it stays after a refresh. Use "Reset demo data" to restore the sample records.

---

## Which programming language is used where

The whole website is written in **TypeScript** (a typed version of JavaScript) using the **React** library. Styling uses **CSS** with **Tailwind CSS**. Settings files use **JSON**.

| File type | Language | What it is used for |
|-----------|----------|---------------------|
| `.tsx` | **TypeScript + JSX (React)** | Pages and on-screen parts (HTML-like layout mixed with code) |
| `.ts`  | **TypeScript** | Logic and data only, no screens (rules, data store, types) |
| `.css` | **CSS (Tailwind CSS v4)** | Colours, fonts, spacing, theme |
| `.json` | **JSON** | Project settings and list of libraries |
| `.md` | **Markdown** | Documentation (this file) |
| `.jpg`, `.ico` | Images | Login page photo, browser tab icon |

Note: there are no separate `.html` files. The HTML is written inside the `.tsx` files (this is called JSX).

### Folder-by-folder guide

```text
hostelpass/
├── package.json            JSON        – project name, commands, libraries
├── tsconfig.json           JSON        – TypeScript settings
├── components.json         JSON        – UI component settings
├── vite.config.ts          TypeScript  – build tool (Vite) settings
├── vitest.config.ts        TypeScript  – test settings
├── eslint.config.js        JavaScript  – code style checker settings
├── public/                 Images      – favicon, robots.txt
└── src/
    ├── styles.css          CSS         – white + navy theme, fonts, colours
    ├── router.tsx          TypeScript+React – sets up page navigation
    ├── start.ts, server.ts TypeScript  – app start-up (do not edit)
    ├── routeTree.gen.ts    TypeScript  – AUTO-GENERATED list of pages (do not edit)
    │
    ├── routes/             TypeScript+React – ONE FILE PER PAGE
    │   ├── __root.tsx              – outer layout of every page
    │   ├── index.tsx               – Login page (role select + demo accounts)
    │   ├── student.tsx             – Student portal layout + sidebar
    │   ├── student.index.tsx       – Student dashboard
    │   ├── student.profile.tsx     – My Profile
    │   ├── student.apply.tsx       – Apply for Outpass form
    │   ├── student.applications.tsx– My Applications
    │   ├── student.pass.tsx        – My QR Pass
    │   ├── student.history.tsx     – Outpass History
    │   ├── student.notifications.tsx – Notifications
    │   ├── admin.tsx               – Warden portal layout + sidebar
    │   ├── admin.index.tsx         – Warden dashboard (statistics)
    │   ├── admin.pending.tsx       – Pending applications
    │   ├── admin.approved.tsx      – Approved applications
    │   ├── admin.rejected.tsx      – Rejected applications
    │   ├── admin.students.tsx      – Student management
    │   ├── admin.records.tsx       – Outpass / gate records
    │   ├── admin.analytics.tsx     – Analytics & Mathematical Insights
    │   ├── security.tsx            – Security portal layout + sidebar
    │   ├── security.index.tsx      – QR scanner + manual pass ID check
    │   ├── security.outside.tsx    – Students currently outside
    │   └── security.records.tsx    – Previous gate records
    │
    ├── components/hostel/  TypeScript+React – HostelPass screen parts
    │   ├── PortalShell.tsx         – sidebar + top bar used by all portals
    │   ├── Logo.tsx                – HostelPass logo
    │   ├── QrScanner.tsx           – camera QR scanner / image upload
    │   ├── PassVerification.tsx    – VALID PASS card, Confirm Exit / Return
    │   ├── ReviewDialog.tsx        – approve / reject window for warden
    │   ├── ApplicationDetails.tsx  – full application details
    │   ├── ApplicationsTable.tsx   – applications table
    │   ├── AdminAppList.tsx        – warden application lists
    │   ├── GateLogTable.tsx        – exit / return log table
    │   ├── NotificationList.tsx    – notifications list
    │   ├── AnalyticsView.tsx       – charts and maths formulas
    │   └── ui-bits.tsx             – small shared pieces (badges, stat cards)
    │
    ├── components/ui/      TypeScript+React – ready-made buttons, inputs, dialogs, tables (shadcn/ui)
    │
    ├── lib/hostel/         TypeScript (no screens) – THE BRAIN OF THE APP
    │   ├── types.ts                – data structures: Student, Application, Pass, GateLog, Notification
    │   ├── seed.ts                 – fictional sample students and records
    │   ├── store.ts                – shared data store (saved in browser localStorage)
    │   ├── logic.ts                – rules: form validation, approve/reject, gate checks, analytics maths
    │   ├── hooks.ts                – connects the data store to the pages
    │   └── format.ts               – date/time formatting helpers
    │
    ├── hooks/              TypeScript  – small reusable helpers (mobile check, live clock)
    ├── assets/             Image       – login page photo
    └── test/               TypeScript  – automatic tests for the outpass rules
```

### Main libraries used
- **React** – building the screens
- **TanStack Start / TanStack Router** – pages and navigation
- **Tailwind CSS** – styling
- **shadcn/ui + Radix UI** – buttons, dialogs, tables
- **lucide-react** – icons
- **Recharts** – analytics charts
- **qrcode.react** – creating the QR pass
- **html5-qrcode** – scanning QR codes with the camera
- **Vitest** – tests
