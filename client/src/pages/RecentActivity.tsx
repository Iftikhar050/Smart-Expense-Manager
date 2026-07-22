import { useEffect, useState } from 'react';
import { apiFetch } from '../lib/api';
import { Receipt, HandCoins, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function RecentActivity() {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedActivity, setSelectedActivity] = useState<number | null>(null);

  useEffect(() => {
  const fetchActivity = async () => {
    try {
      const res = await apiFetch('/users/activity');
      if (res.ok) {
        setActivities(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
    fetchActivity();
  }, []);

  if (loading) return <div className="text-center py-12">Loading activity...</div>;

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-primary dark:text-indigo-400 mb-8 flex items-center gap-3">
        <Clock className="w-8 h-8 text-secondary" />
        Recent Activity
      </h1>
      
      {activities.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow-sm border border-slate-200 text-center text-slate-500">
          No recent activity found.
        </div>
      ) : (
        <div className="relative border-l-2 border-slate-200 ml-4 md:ml-6 mt-6 pb-8 space-y-10">
          {activities.map((item, idx) => (
            <div key={idx} className="relative pl-8 md:pl-10">
              {/* Timeline marker */}
              <div 
                className={`absolute w-10 h-10 rounded-full flex items-center justify-center -left-[21px] top-0 border-4 border-slate-50 shadow-sm z-10 transition-transform duration-300 hover:scale-110 ${item.type === 'expense' ? 'bg-secondary' : 'bg-accent'}`}
              >
                {item.type === 'expense' ? (
                  <Receipt className="w-4 h-4 text-white" />
                ) : (
                  <HandCoins className="w-4 h-4 text-white" />
                )}
              </div>
              
              <div 
                className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-md transition-shadow cursor-pointer group"
                onClick={() => setSelectedActivity(selectedActivity === idx ? null : idx)}
              >
                <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-bold uppercase tracking-wider ${item.type === 'expense' ? 'text-secondary' : 'text-accent'}`}>
                        {item.type === 'expense' ? 'Expense Added' : 'Payment Recorded'}
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="text-xs text-slate-400 font-medium">
                        {new Date(item.date).toLocaleDateString()} at {new Date(item.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </div>
                    
                    {item.type === 'expense' ? (
                      <div>
                        <div className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-1 group-hover:text-primary dark:group-hover:text-indigo-400 transition-colors">
                          {item.data.description}
                        </div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">
                          Added in <Link to={`/groups/${item.data.group_id}`} className="font-semibold text-primary dark:text-indigo-400 hover:underline" onClick={e => e.stopPropagation()}>{item.data.group.name}</Link>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-1 group-hover:text-primary dark:group-hover:text-indigo-400 transition-colors">
                          {item.data.sender?.name} paid {item.data.receiver?.name}
                        </div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">
                          In <Link to={`/groups/${item.data.group_id}`} className="font-semibold text-primary dark:text-indigo-400 hover:underline" onClick={e => e.stopPropagation()}>{item.data.group.name}</Link>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="text-left sm:text-right">
                    <div className="text-sm text-slate-500 font-medium mb-1 uppercase tracking-wide">Amount</div>
                    <div className={`text-2xl font-bold ${item.type === 'expense' ? 'text-slate-800 dark:text-slate-100' : 'text-accent'}`}>
                      ${Number(item.data.amount).toFixed(2)}
                    </div>
                  </div>
                </div>
                
                {/* Expanded Details */}
                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${selectedActivity === idx ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                  <div className="bg-slate-50 dark:bg-slate-900/50 p-4 border-t border-slate-200 dark:border-slate-700">
                    {item.type === 'expense' ? (
                      <div>
                        <div className="flex justify-between items-center mb-3">
                          <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500">Split Details</h5>
                          <span className="text-xs text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 px-2 py-1 border border-slate-200 dark:border-slate-700 rounded font-medium shadow-sm">
                            Split method: {item.data.split_type === 'EQUAL' ? 'Equally' : item.data.split_type === 'EXACT' ? 'Exact amounts' : item.data.split_type === 'PERCENTAGE' ? 'Percentages' : 'Shares'}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">Paid by <span className="font-semibold text-slate-800 dark:text-slate-200">{item.data.payer?.name}</span></p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {item.data.shares?.map((share: any) => (
                            <div key={share.id} className="flex justify-between items-center bg-white dark:bg-slate-800 p-2 rounded border border-slate-100 dark:border-slate-700 shadow-sm text-sm">
                              <span className="text-slate-700 dark:text-slate-300 font-medium">{share.user.name}</span>
                              <span className="font-bold text-slate-800 dark:text-slate-100">${parseFloat(share.amount_owed).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div>
                        <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Payment Note</h5>
                        <p className="text-sm text-slate-700 italic text-center text-slate-500">
                          {item.data.note || 'No note provided for this payment.'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
