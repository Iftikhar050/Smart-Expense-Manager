# 💸 FairShare (Smart Expense Manager)

FairShare is a modern, full-stack expense-splitting application built to take the headache out of shared bills. Whether you are splitting rent with roommates, organizing a group trip, or just keeping track of dinner tabs, FairShare ensures everyone knows exactly who owes what.

## ✨ Features

- **Group Management:** Create groups and invite friends to keep expenses organized by event, apartment, or trip.
- **Role-Based Access Control (RBAC):** Group creators act as **Admins** and can manage member permissions. Members can be **Editors** (add/edit expenses and members) or **Viewers** (read-only access).
- **Admin Dashboard:** A dedicated command center for Admins to track the financial progress of all groups they manage. 
- **Trip Budgets:** Set total budgets for trips/groups when creating them. Admins and members can track the Total Spent and Total Remaining dynamically.
- **Easy Onboarding:** Invite members effortlessly! The system auto-generates credentials so friends can log in and view their specific group finances instantly.
- **Flexible Splitting:** Add expenses and split them *equally*, by *exact amounts*, by *percentages*, or by *shares*.
- **Debt Simplification:** A built-in algorithm minimizes the total number of transactions required to settle all debts within a group.
- **Data Visualization & Analytics:** Get a quick visual breakdown of "Who Spent What" alongside detailed activity logs tracking every payment and expense.
- **Fluid UI:** Enjoy a premium, app-like experience with buttery-smooth page transitions, micro-animations, and responsive layouts powered by Tailwind CSS.

## 🛠️ Tech Stack

**Frontend:**
- **React.js** (built with Vite for lightning-fast HMR)
- **Tailwind CSS** (for highly customizable, utility-first styling)
- **Lucide React** (beautiful, consistent SVG icons)
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
