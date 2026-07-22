import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../lib/api';
import { Avatar } from '../components/Avatar';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const COLORS = ['#6366f1', '#14b8a6', '#f59e0b', '#ec4899', '#8b5cf6', '#ef4444', '#10b981'];

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await apiFetch('/users/dashboard');
        if (res.ok) {
          setData(await res.json());
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) return <div className="text-center py-12">Loading dashboard...</div>;
  if (!data) return <div className="text-center py-12 text-red-500">Failed to load dashboard</div>;

  const owesMe = data.friends.filter((f: any) => f.balance > 0);
  const iOwe = data.friends.filter((f: any) => f.balance < 0);

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-semibold text-slate-800">Dashboard</h1>
        <div className="flex gap-3">
          <Link to="/groups" className="bg-white text-slate-700 border border-slate-300 px-4 py-2 rounded-lg font-medium hover:bg-slate-50 transition shadow-sm">
            Settle up
          </Link>
          <Link to="/groups/new" className="bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-opacity-90 transition shadow-sm">
            Start a new group
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mb-8 flex divide-x">
        <div className="flex-1 text-center">
          <div className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-1">Total balance</div>
          <div className={`text-xl font-bold ${data.totalBalance > 0 ? 'text-green-600' : data.totalBalance < 0 ? 'text-red-600' : 'text-slate-700'}`}>
            {data.totalBalance > 0 ? '+' : ''}${Math.abs(data.totalBalance).toFixed(2)}
          </div>
        </div>
        <div className="flex-1 text-center">
          <div className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-1">You owe</div>
          <div className="text-xl font-bold text-red-600">
            ${Math.abs(data.totalOwe).toFixed(2)}
          </div>
        </div>
        <div className="flex-1 text-center">
          <div className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-1">You are owed</div>
          <div className="text-xl font-bold text-green-600">
            ${Math.abs(data.totalOwed).toFixed(2)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        <div>
          <h2 className="text-lg font-bold text-slate-700 mb-4 uppercase text-sm border-b pb-2">You owe</h2>
          {iOwe.length === 0 ? (
            <p className="text-slate-500 text-sm">You do not owe anything</p>
          ) : (
            <ul className="space-y-4">
              {iOwe.map((f: any) => (
                <li key={f.id} className="flex justify-between items-center bg-white p-3 rounded shadow-sm border border-slate-100">
                  <div className="flex items-center">
                    <Avatar name={f.name} size="md" className="mr-3" />
                    <span className="font-medium text-slate-800">{f.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-red-600">you owe</div>
                    <div className="font-bold text-red-600">${Math.abs(f.balance).toFixed(2)}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        
        <div>
          <h2 className="text-lg font-bold text-slate-700 mb-4 uppercase text-sm border-b pb-2 text-right">You are owed</h2>
          {owesMe.length === 0 ? (
            <p className="text-slate-500 text-sm text-right">You are not owed anything</p>
          ) : (
            <ul className="space-y-4">
              {owesMe.map((f: any) => (
                <li key={f.id} className="flex justify-between items-center bg-white p-3 rounded shadow-sm border border-slate-100">
                  <div className="flex items-center">
                    <Avatar name={f.name} size="md" className="mr-3" />
                    <span className="font-medium text-slate-800">{f.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-green-600">owes you</div>
                    <div className="font-bold text-green-600">${Math.abs(f.balance).toFixed(2)}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-primary mb-6">Group Overview</h2>
        {data.groupDetails && data.groupDetails.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {data.groupDetails.map((group: any) => (
              <div key={group.id} className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 flex flex-col">
                <div className="flex justify-between items-center mb-4 border-b pb-4">
                  <Link to={`/groups/${group.id}`} className="text-xl font-bold text-primary hover:underline">{group.name}</Link>
                  <div className="text-right">
                    <div className="text-xs text-slate-500 uppercase tracking-wide font-medium">Your Balance</div>
                    <div className={`font-bold ${group.userDebt > 0 ? 'text-green-600' : group.userDebt < 0 ? 'text-red-600' : 'text-slate-600'}`}>
                      {group.userDebt > 0 ? '+' : ''}${Math.abs(group.userDebt).toFixed(2)}
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col gap-4 flex-1">
                  <div className="bg-slate-50 p-4 rounded border border-slate-100">
                    <div className="text-xs text-slate-500 uppercase tracking-wide font-medium mb-1">Total Group Expense</div>
                    <div className="text-2xl font-bold text-slate-800">${group.totalSpent.toFixed(2)}</div>
                  </div>
                  
                  <div className="flex-1">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Who Spent What</h4>
                    {group.membersSpending.length === 0 ? (
                       <p className="text-sm text-slate-500">No expenses yet.</p>
                    ) : (
                      <div className="h-48 w-full mt-2">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={group.membersSpending.filter((m: any) => m.spent > 0)}
                              dataKey="spent"
                              nameKey="name"
                              cx="50%"
                              cy="50%"
                              innerRadius={40}
                              outerRadius={70}
                              paddingAngle={2}
                              stroke="none"
                            >
                              {group.membersSpending.map((entry: any, index: number) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip 
                              formatter={(value: number) => `$${value.toFixed(2)}`}
                              contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            />
                            <Legend layout="horizontal" verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white p-8 rounded-lg shadow-sm border border-slate-200 text-center text-slate-500">
            No group data available.
          </div>
        )}
      </div>
    </div>
  );
}
