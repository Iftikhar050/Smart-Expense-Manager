import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Clock, ReceiptText, Users } from 'lucide-react';

export default function Sidebar() {
  const location = useLocation();
  
  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard className="w-5 h-5 mr-3" /> },
    { name: 'Recent Activity', path: '/activity', icon: <Clock className="w-5 h-5 mr-3" /> },
    { name: 'Group Expenses', path: '/expenses', icon: <ReceiptText className="w-5 h-5 mr-3" /> },
    { name: 'Groups', path: '/groups', icon: <Users className="w-5 h-5 mr-3" /> }
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 hidden md:block min-h-[calc(100vh-64px)]">
      <nav className="p-4 space-y-1">
        {navItems.map(item => {
          const isActive = location.pathname.startsWith(item.path);
          return (
            <Link 
              key={item.name} 
              to={item.path} 
              className={`flex items-center px-4 py-3 rounded-lg font-medium transition-colors ${
                isActive 
                  ? 'bg-secondary/10 text-secondary' 
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              {item.icon}
              {item.name}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
