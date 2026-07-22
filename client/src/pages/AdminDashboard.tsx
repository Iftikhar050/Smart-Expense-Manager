import { useEffect, useState } from 'react';
import { apiFetch } from '../lib/api';
import { Link } from 'react-router-dom';
import { Shield, Receipt, HandCoins, DollarSign, Wallet, TrendingDown } from 'lucide-react';
import { Avatar } from '../components/Avatar';
import { Badge } from '../components/Badge';

export default function AdminDashboard() {
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const res = await apiFetch('/admin/dashboard');
        if (res.ok) {
          const data = await res.json();
          setGroups(data.groups);
        }
      } catch (err) {
        console.error('Failed to load admin data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAdminData();
  }, []);

  if (loading) return <div className="text-center py-12">Loading Admin Dashboard...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="bg-primary/10 p-3 rounded-full">
          <Shield className="w-8 h-8 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Admin Dashboard</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Manage and oversee all activities across your administered groups</p>
        </div>
      </div>

      {groups.length === 0 ? (
        <div className="p-12 text-center text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
          You do not administer any groups with activities yet.
        </div>
      ) : (
        groups.map(group => (
          <div key={group.id} className="mb-12">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center">
              <Link to={`/groups/${group.id}`} className="hover:text-primary transition">{group.name}</Link>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 flex items-center transition-colors duration-200">
                <div className="bg-blue-100 dark:bg-blue-900/30 p-4 rounded-full mr-4">
                  <Wallet className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <div className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Total Budget</div>
                  <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">${group.budget.toFixed(2)}</div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 flex items-center transition-colors duration-200">
                <div className="bg-red-100 dark:bg-red-900/30 p-4 rounded-full mr-4">
                  <TrendingDown className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <div className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Total Spent</div>
                  <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">${group.spent.toFixed(2)}</div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 flex items-center transition-colors duration-200">
                <div className={`p-4 rounded-full mr-4 ${group.remaining >= 0 ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                  <DollarSign className={`w-6 h-6 ${group.remaining >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`} />
                </div>
                <div>
                  <div className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Total Remaining</div>
                  <div className={`text-2xl font-bold ${group.remaining >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    ${group.remaining.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden transition-colors duration-200">
              <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Activity Log</h2>
              </div>
              
              {group.activity.length === 0 ? (
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
        ))
      )}
    </div>
  );
}
