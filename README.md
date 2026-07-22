# 💸 FairShare (Smart Expense Manager)

FairShare is a modern, full-stack expense-splitting application built to take the headache out of shared bills. Whether you are splitting rent with roommates, organizing a group trip, or just keeping track of dinner tabs, FairShare ensures everyone knows exactly who owes what.

![FairShare Dashboard Overview]() *(Consider adding a screenshot of your app here!)*

## ✨ Features

- **Group Management:** Create groups and invite friends to keep expenses organized by event, apartment, or trip.
- **Flexible Splitting:** Add expenses and split them *equally*, by *exact amounts*, by *percentages*, or by *shares*.
- **Debt Simplification:** A built-in algorithm minimizes the total number of transactions required to settle all debts within a group.
- **Data Visualization:** Beautiful, interactive charts (powered by Recharts) provide a quick visual breakdown of "Who Spent What".
- **Fluid UI:** Enjoy a premium, app-like experience with buttery-smooth page transitions and animations powered by Framer Motion.
- **Activity Tracking:** A detailed activity log keeps track of every expense added, edited, or deleted.

## 🛠️ Tech Stack

**Frontend:**
- **React.js** (built with Vite for lightning-fast HMR)
- **Tailwind CSS** (for highly customizable, utility-first styling)
- **Framer Motion** (for smooth page transitions and micro-animations)
- **Recharts** (for elegant data visualization)
- **React Router** (for client-side routing)

**Backend:**
- **Node.js & Express.js** (robust REST API)
- **PostgreSQL** (relational database)
- **Prisma ORM** (type-safe database access and migrations)
- **JWT** (for secure user authentication)

## 🚀 Getting Started

Follow these steps to run the project locally on your machine.

### Prerequisites
- Node.js (v18 or higher recommended)
- PostgreSQL database

### 1. Clone the repository
```bash
git clone https://github.com/Iftikhar050/Smart-Expense-Manager.git
cd Smart-Expense-Manager
```

### 2. Backend Setup
```bash
cd server
npm install
```

Create a `.env` file in the `server` directory and add your PostgreSQL connection string and a JWT secret:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/expense_splitter?schema=public"
JWT_SECRET="your_super_secret_key"
```

Run database migrations to generate the schema:
```bash
npx prisma migrate dev
```

Start the backend server:
```bash
npm run dev
```

### 3. Frontend Setup
Open a new terminal window and navigate to the client folder:
```bash
cd client
npm install
```

Start the Vite development server:
```bash
npm run dev
```

The application will now be running on `http://localhost:5173`.

## 🤝 Contributing
Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/Iftikhar050/Smart-Expense-Manager/issues).

## 📝 License
This project is open-source and available under the [MIT License](LICENSE).
