import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import GroupList from './pages/GroupList';
import GroupDetail from './pages/GroupDetail';
import Dashboard from './pages/Dashboard';
import RecentActivity from './pages/RecentActivity';
import AllExpenses from './pages/AllExpenses';
import GroupFinances from './pages/GroupFinances';
import CreateGroup from './pages/CreateGroup';
import Layout from './components/Layout';

function App() {
  const token = localStorage.getItem('token');
  
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Protected routes wrapped in Layout */}
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="activity" element={<RecentActivity />} />
          <Route path="expenses" element={<AllExpenses />} />
          <Route path="expenses/:id" element={<GroupFinances />} />
          <Route path="groups" element={<GroupList />} />
          <Route path="groups/new" element={<CreateGroup />} />
          <Route path="groups/:id" element={<GroupDetail />} />
        </Route>
        
        <Route path="*" element={<Navigate to={token ? "/dashboard" : "/login"} replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
