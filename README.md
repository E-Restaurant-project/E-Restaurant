# 🍲 ភោជនីយដ្ឋាន ភូមិយើង (Phum Yeung Restaurant) - Full Stack E-Restaurant

A bilingual (Khmer 🇰🇭 + English 🇬🇧) Cloud Kitchen & Online Food Ordering Application built with:
- **Frontend**: React 18 + Vite, Pure CSS (BEM methodology), Context API State Management
- **Backend API**: Node.js + Express.js REST API
- **Database**: MongoDB + Mongoose ODM (Auto-seeding, local & MongoDB Atlas support)
- **API Documentation**: [`docs/API_DOCUMENTATION.md`](docs/API_DOCUMENTATION.md)

---

## 📁 រចនាសម្ព័ន្ធគម្រោង (Project Architecture)

```
E-Restaurant/
├── admin/                     # React 18 + Vite Admin Dashboard Application
│   ├── public/                # Static assets & logo
│   │   └── phum_yeung_logo.jpg
│   ├── src/
│   │   ├── components/        # Admin UI components (AdminLayout, Sidebar, Modals)
│   │   ├── config/            # API endpoints configuration
│   │   ├── context/           # React Context (Auth, Language, Restaurant, Toast)
│   │   ├── hooks/             # Custom React hooks
│   │   ├── locales/           # Bilingual translations (km.json, en.json)
│   │   ├── pages/             # Admin pages (Dashboard, Menu, Orders, Promos, Settings, Customers)
│   │   ├── services/          # API service calling Backend
│   │   ├── styles/            # Admin CSS styles
│   │   ├── App.jsx            # Admin routes
│   │   └── main.jsx           # Entrypoint
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── frontend/                  # React 18 + Vite Frontend Application
│   ├── public/                # Static assets, fonts, food photos, and icons
│   │   ├── images/foods/      # 500+ Authentic Khmer food images
│   │   └── phum_yeung_logo.jpg
│   ├── src/
│   │   ├── components/        # Reusable UI components (Navbar, Footer, Modals)
│   │   ├── config/            # Frontend environment & endpoint configuration
│   │   ├── context/           # React Context (Auth, Cart, Language, Restaurant)
│   │   ├── data/              # Fallback menu & offline seed data
│   │   ├── hooks/             # Custom React hooks
│   │   ├── locales/           # Bilingual translations (km.json, en.json)
│   │   ├── pages/             # Page views (Home, Menu, Track, Admin, Checkout)
│   │   ├── services/          # API client calling Backend (Fetch service)
│   │   ├── styles/            # Pure CSS design system & BEM styles
│   │   ├── App.jsx            # Main app router & layout wrapper
│   │   └── main.jsx           # React DOM root entrypoint
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── backend/                   # Node.js + Express.js REST API Server
│   ├── config/                # MongoDB Mongoose connection
│   ├── controllers/           # API controllers (Auth, Dishes, Orders, Promos, etc.)
│   ├── middleware/            # JWT authentication & authorization middleware
│   ├── models/                # Mongoose models (Dish, Order, Promo, Setting, User)
│   ├── routes/                # Express router endpoints
│   ├── seeds/                 # Auto-seeding script with Khmer dishes
│   ├── .env                   # Server environment variables & Mongo URI
│   ├── server.js              # Express server entrypoint (Port 5000)
│   └── package.json
│
├── docs/                      # Documentation for Teachers & Developers
│   ├── API_DOCUMENTATION.md   # Complete REST API specification (Endpoints, payloads)
│   └── Bakong KHQR.docx       # National Bank of Cambodia Bakong payment docs
│
├── package.json               # Root monorepo scripts runner
└── README.md
```

---

## 🌟 លក្ខណៈសម្បត្តិ Full-Stack (Key Features)

### 1. ផ្នែកខាងមុខ (React Frontend)
- **ប្រព័ន្ធពីរភាសា (Khmer 🇰🇭 / English 🇬🇧)** ជាមួយ Font "Kantumruy Pro" & "Noto Sans Khmer"
- **ការកុម្ម៉ង់អាហារអនឡាញ (Cloud Kitchen Ordering)**:
  - ជម្រើសដឹកជញ្ជូនដល់ផ្ទះ/ការិយាល័យ (Doorstep Delivery) ជាមួយបញ្ជីជ្រើសរើសខណ្ឌក្នុងរាជធានីភ្នំពេញ
  - ជម្រើសមកយកផ្ទាល់ពីផ្ទះបាយកណ្តាល BKK1 (Kitchen Hub Pickup)
  - ជម្រើសទូទាត់ប្រាក់៖ COD (សាច់ប្រាក់) ឬស្កេន **Bakong KHQR**
- **ទំព័រតាមដានការកុម្ម៉ង់ (Track Order)**: វាយលេខកូដ Order ID (ឧ. `PY-ORD-1001`) ដើម្បីមើល Timeline ជាក់ស្តែង (`Received` ➔ `Preparing` ➔ `Delivering` ➔ `Delivered`)
- **ផ្ទាំងគ្រប់គ្រងរដ្ឋបាល (Advanced Admin Suite)**:
  - Dashboard & Analytics (ក្រាហ្វិកចំណូលតាមប្រភេទមុខម្ហូប, Export Orders to CSV)
  - គ្រប់គ្រងមុខម្ហូប CRUD (Add / Edit / Delete Dish, ស្តុកទំនិញ)
  - គ្រប់គ្រងកូដបញ្ចុះតម្លៃ Promo Codes CRUD (ឧ. `PHUM10`, `KHMER20`)
  - គ្រប់គ្រងអតិថិជន Customer CRM (មើលប្រវត្តិ Order History និងចំណាយសរុប)
  - ការកំណត់ហាង Store Settings (បើក/បិទហាង, ថ្លៃដឹក, អត្រាប្តូរប្រាក់, របារប្រកាសដំណឹង Top Banner)

### 2. ផ្នែកខាងក្រោយ (Node.js + Express API)
- **REST API Specification**: មើលឯកសារលម្អិតក្នុង [`docs/API_DOCUMENTATION.md`](docs/API_DOCUMENTATION.md)
  - `/api/auth` (ផ្ទៀងផ្ទាត់គណនី Admin និង Customer ដោយប្រើ **JWT Token** & **Bcryptjs**)
  - `/api/dishes` (CRUD មុខម្ហូប)
  - `/api/orders` (កត់ត្រាការកុម្ម៉ង់, តាមដាន Order ID, ប្តូរស្ថានភាព)
  - `/api/promos` (បង្កើត និងផ្ទៀងផ្ទាត់កូដបញ្ចុះតម្លៃ)
  - `/api/settings` (ការកំណត់ប្រព័ន្ធផ្ទះបាយ)
  - `/api/payments/bakong` (បង្កើត dynamic KHQR payload និង verify transaction)
  - `/api/health` (Health check endpoint)

---

## 🚀 របៀបដំណើរការប្រព័ន្ធ (How to Run)

### ជំហានទី ១៖ ដំឡើង Dependencies
អ្នកអាចដំឡើង dependencies ទាំង Frontend និង Backend ក្នុងពេលតែមួយពី Root Directory៖
```bash
npm run install:all
```

*(ឬដំឡើងដោយឡែក៖)*
```bash
cd frontend && npm install
cd ../backend && npm install
```

---

### ជំហានទី ២៖ ដំណើរការ Server, Frontend & Admin
- **ដំណើរការ Backend API**:
  ```bash
  npm run dev:backend
  ```
  *(API នឹងដំណើរការលើ `http://localhost:5000`)*

- **ដំណើរការ Frontend Client**:
  ```bash
  npm run dev:frontend
  ```
  *(Frontend នឹងដំណើរការលើ `http://localhost:3000`)*

- **ដំណើរការ Admin Dashboard**:
  ```bash
  npm run dev:admin
  ```
  *(Admin នឹងដំណើរការលើ `http://localhost:5173` ឬ port ដែល Vite បង្ហាញ)*

- **(ឬដំណើរការទាំងអស់ក្នុងពេលតែមួយ)**:
  ```bash
  npm run dev
  ```

#### វិធីទី ២៖ ចូលទៅក្នុង Folder ផ្ទាល់
```bash
# Terminal 1 - Backend:
cd backend
npm run dev

# Terminal 2 - Frontend:
cd frontend
npm run dev
```

---

## 🔑 ព័ត៌មានគណនីគំរូ (Demo Credentials)
- **Admin Portal**: `http://localhost:3000/admin/login`
  - **Email**: `admin@phumyeung.com`
  - **Password**: `admin123`
- **Order ID សម្រាប់តេស្តតាមដាន (Track Order)**: `PY-ORD-1001` ឬ `PY-ORD-1002`
- **កូដបញ្ចុះតម្លៃសម្រាប់ Cart**: `PHUM10` (10% OFF), `KHMER20` (20% OFF)
