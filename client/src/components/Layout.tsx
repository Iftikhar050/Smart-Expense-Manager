import { Outlet, Navigate, Link, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import { AnimatePresence, motion } from 'framer-motion';

export default function Layout() {
  const token = localStorage.getItem('token');
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col">
      <header className="bg-primary text-white p-4 shadow-md sticky top-0 z-10">
        <div className="container mx-auto flex justify-between items-center">
          <Link to="/dashboard" className="text-2xl font-bold text-accent">FairShare</Link>
          <button 
            onClick={() => { localStorage.removeItem('token'); window.location.href='/login'; }}
            className="text-sm bg-secondary px-4 py-2 rounded font-medium hover:bg-opacity-90 transition"
          >
            Logout
          </button>
        </div>
      </header>
      
      <div className="flex flex-1 container mx-auto">
        <Sidebar />
        <main className="flex-1 p-4 md:p-8 max-w-4xl overflow-x-hidden relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
