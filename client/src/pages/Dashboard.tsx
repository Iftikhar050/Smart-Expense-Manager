import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../lib/api';
import { Avatar } from '../components/Avatar';
import { Badge } from '../components/Badge';
import { Wallet, TrendingDown, DollarSign, Receipt, HandCoins, ArrowRight } from 'lucide-react';

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
        <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">Dashboard</h1>
        <div className="flex gap-3">
          <Link to="/groups" className="bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 px-4 py-2 rounded-lg font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition shadow-sm">
            Settle up
          </Link>
          <Link to="/groups/new" className="bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-opacity-90 transition shadow-sm">
            Start a new group
          </Link>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6 mb-8 flex divide-x dark:divide-slate-700 transition-colors duration-200">
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
          <h2 className="text-lg font-bold text-slate-700 dark:text-slate-200 mb-4 uppercase text-sm border-b dark:border-slate-700 pb-2">You owe</h2>
          {iOwe.length === 0 ? (
            <p className="text-slate-500 text-sm">You do not owe anything</p>
          ) : (
            <ul className="space-y-4">
              {iOwe.map((f: any) => (
                <li key={f.id} className="flex justify-between items-center bg-white dark:bg-slate-800 p-3 rounded shadow-sm border border-slate-100 dark:border-slate-700 transition-colors duration-200">
                  <div className="flex items-center">
                    <Avatar name={f.name} size="md" className="mr-3" />
                    <span className="font-medium text-slate-800 dark:text-slate-200">{f.name}</span>
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
          <h2 className="text-lg font-bold text-slate-700 dark:text-slate-200 mb-4 uppercase text-sm border-b dark:border-slate-700 pb-2 text-right">You are owed</h2>
          {owesMe.length === 0 ? (
            <p className="text-slate-500 text-sm text-right">You are not owed anything</p>
          ) : (
            <ul className="space-y-4">
              {owesMe.map((f: any) => (
                <li key={f.id} className="flex justify-between items-center bg-white dark:bg-slate-800 p-3 rounded shadow-sm border border-slate-100 dark:border-slate-700 transition-colors duration-200">
                  <div className="flex items-center">
                    <Avatar name={f.name} size="md" className="mr-3" />
                    <span className="font-medium text-slate-800 dark:text-slate-200">{f.name}</span>
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
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6">Group Overview</h2>
        {data.groupDetails && data.groupDetails.filter((g: any) => g.myRole !== 'ADMIN').length > 0 ? (
          data.groupDetails.filter((g: any) => g.myRole !== 'ADMIN').map((group: any) => {
            const totalBudget = group.budget || 0;
            const totalRemaining = totalBudget - group.totalSpent;
            
            return (
              <div key={group.id} className="mb-12">
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center">
                  <Link to={`/groups/${group.id}`} className="hover:text-primary transition">{group.name}</Link>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 flex items-center transition-colors duration-200">
                    <div className="bg-blue-100 dark:bg-blue-900/30 p-4 rounded-full mr-4">
                      <Wallet className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Total Budget</div>
                      <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">${totalBudget.toFixed(2)}</div>
                    </div>
                  </div>
                  
                  <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 flex items-center transition-colors duration-200">
                    <div className="bg-red-100 dark:bg-red-900/30 p-4 rounded-full mr-4">
                      <TrendingDown className="w-6 h-6 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Total Spent</div>
                      <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">${group.totalSpent.toFixed(2)}</div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 flex items-center transition-colors duration-200">
                    <div className={`p-4 rounded-full mr-4 ${totalRemaining >= 0 ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                      <DollarSign className={`w-6 h-6 ${totalRemaining >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`} />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Total Remaining</div>
                      <div className={`text-2xl font-bold ${totalRemaining >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        ${totalRemaining.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden transition-colors duration-200">
                  <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                    <h4 className="text-lg font-bold text-slate-800 dark:text-slate-100">Activity Log</h4>
                    <Link to={`/groups/${group.id}`} className="text-sm text-primary dark:text-indigo-400 font-medium hover:underline">View all</Link>
                  </div>
                  
                  {!group.activity || group.activity.length === 0 ? (
                    <div className="p-12 text-center text-slate-500 dark:text-slate-400">
                      No activities in this group yet.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 dark:bg-slate-900/50 border-y border-slate-200 dark:border-slate-700 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold">
                            <th className="p-4 w-10"></th>
                            <th className="p-4">Date</th>
                            <th className="p-4 w-1/4">Description</th>
                            <th className="p-4">Paid By</th>
                            <th className="p-4 text-right">Amount</th>
                            <th className="p-4 w-1/4">Details</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                          {group.activity.map((act: any, idx: number) => (
                            <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition">
                              <td className="p-4">
                                <div className={`p-2 rounded-full inline-flex items-center justify-center ${act.type === 'expense' ? 'bg-secondary/10 text-secondary' : 'bg-accent/10 text-accent'}`}>
                                  {act.type === 'expense' ? <Receipt className="w-4 h-4" /> : <HandCoins className="w-4 h-4" />}
                                </div>
                              </td>
                              <td className="p-4 text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                {new Date(act.date).toLocaleDateString()}
                              </td>
                              <td className="p-4">
                                <div className="font-semibold text-slate-800 dark:text-slate-200">
                                  {act.type === 'expense' ? act.data.description : 'Payment'}
                                </div>
                                {act.type === 'expense' && act.data.category && (
                                  <Badge variant="secondary" className="mt-1">{act.data.category}</Badge>
                                )}
                              </td>
                              <td className="p-4">
                                {act.type === 'expense' ? (
                                  <div className="flex items-center gap-2">
                                    <Avatar name={act.data.payer?.name || 'Unknown'} size="sm" />
                                    <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{act.data.payer?.name || 'Unknown'}</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <Avatar name={act.data.sender?.name || 'Unknown'} size="sm" />
                                    <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{act.data.sender?.name || 'Unknown'}</span>
                                  </div>
                                )}
                              </td>
                              <td className="p-4 text-right">
                                <span className="font-bold text-slate-800 dark:text-slate-100">${parseFloat(act.data.amount).toFixed(2)}</span>
                              </td>
                              <td className="p-4">
                                {act.type === 'expense' ? (
                                  <div className="flex flex-wrap gap-1">
                                    {act.data.shares?.map((share: any) => (
                                      <span key={share.id} className="inline-flex items-center text-xs px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-600">
                                        {share.user?.name || 'Unknown'}: <span className="font-bold ml-1">${parseFloat(share.amount_owed).toFixed(2)}</span>
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                    <span>Paid to</span>
                                    <Avatar name={act.data.receiver?.name || 'Unknown'} size="sm" />
                                    <span className="font-medium text-slate-800 dark:text-slate-200">{act.data.receiver?.name || 'Unknown'}</span>
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-white dark:bg-slate-800 p-8 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 text-center text-slate-500 dark:text-slate-400 transition-colors duration-200">
            {data.groupDetails && data.groupDetails.some((g: any) => g.myRole === 'ADMIN') 
              ? "Your administered groups are visible in the Admin Dashboard." 
              : "No group data available."}
          </div>
        )}
      </div>
    </div>
  );
}
