import { useEffect, useState } from 'react';
import { apiFetch } from '../lib/api';
import { useNavigate } from 'react-router-dom';
import { ArrowUpDown, ArrowUp, ArrowDown, Receipt } from 'lucide-react';
import { AvatarStack } from '../components/Avatar';
import { FilterBar } from '../components/FilterBar';
import { TableSkeleton } from '../components/Skeleton';
import { useDebounce } from '../hooks/useDebounce';

export default function AllExpenses() {
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 250);
  
  const [sortField, setSortField] = useState<'name' | 'members' | 'date' | 'balance'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const navigate = useNavigate();

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/users/dashboard');
      if (res.ok) {
        const data = await res.json();
        setGroups(data.groupDetails || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleSort = (field: 'name' | 'members' | 'date' | 'balance') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const filteredGroups = groups.filter(g => 
    g.name.toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  const sortedGroups = [...filteredGroups].sort((a, b) => {
    let comparison = 0;
    if (sortField === 'name') {
      comparison = a.name.localeCompare(b.name);
    } else if (sortField === 'members') {
      comparison = (a.memberCount || 0) - (b.memberCount || 0);
    } else if (sortField === 'date') {
      comparison = new Date(a.lastActivityDate || 0).getTime() - new Date(b.lastActivityDate || 0).getTime();
    } else if (sortField === 'balance') {
      comparison = a.userDebt - b.userDebt;
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const renderSortIcon = (field: string) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 text-slate-400" />;
    return sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-primary" /> : <ArrowDown className="w-3 h-3 text-primary" />;
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100 flex items-center">
          <Receipt className="w-6 h-6 mr-2 text-primary" /> All Expenses
        </h1>
      </div>

      <div className="mb-4">
        <FilterBar 
          value={search} 
          onChange={setSearch} 
          placeholder="Search groups by name..." 
        />
      </div>

      {loading ? (
        <TableSkeleton rows={4} />
      ) : groups.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden text-center py-12 text-slate-500 dark:text-slate-400">
          You are not part of any groups yet. Create one to get started!
        </div>
      ) : sortedGroups.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 p-8 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 text-center text-slate-500 dark:text-slate-400">
          No groups match "{search}".
          <div className="mt-2">
            <button onClick={() => setSearch('')} className="text-primary dark:text-indigo-400 hover:underline font-medium">Clear filter</button>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          {/* Desktop Table View */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 font-semibold">
                  <th 
                    className="p-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition" 
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center gap-1">
                      Group Name {renderSortIcon('name')}
                    </div>
                  </th>
                  <th 
                    className="p-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                    onClick={() => handleSort('members')}
                  >
                    <div className="flex items-center gap-1">
                      Members {renderSortIcon('members')}
                    </div>
                  </th>
                  <th 
                    className="p-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                    onClick={() => handleSort('balance')}
                  >
                    <div className="flex items-center gap-1">
                      Your Balance {renderSortIcon('balance')}
                    </div>
                  </th>
                  <th 
                    className="p-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition text-right"
                    onClick={() => handleSort('date')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Last Activity {renderSortIcon('date')}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {sortedGroups.map(group => (
                  <tr 
                    key={group.id} 
                    className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition cursor-pointer"
                    onClick={() => navigate(`/expenses/${group.id}`)}
                  >
                    <td className="p-4">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">{group.name}</div>
                    </td>
                    <td className="p-4">
                      {group.members && group.members.length > 0 ? (
                        <AvatarStack members={group.members} max={3} size="sm" />
                      ) : (
                        <span className="text-slate-400 text-sm">No members</span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className={`font-medium ${group.userDebt > 0 ? 'text-secondary' : group.userDebt < 0 ? 'text-red-500' : 'text-slate-500 dark:text-slate-400'}`}>
                        {group.userDebt > 0 ? `Gets back $${group.userDebt.toFixed(2)}` : group.userDebt < 0 ? `Owes $${Math.abs(group.userDebt).toFixed(2)}` : 'Settled up'}
                      </div>
                    </td>
                    <td className="p-4 text-slate-500 dark:text-slate-400 text-sm text-right">
                      {group.lastActivityDate ? new Date(group.lastActivityDate).toLocaleDateString() : 'Never'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="block sm:hidden divide-y divide-slate-100">
            {sortedGroups.map(group => (
              <div 
                key={group.id} 
                className="p-4 hover:bg-slate-50 transition cursor-pointer flex flex-col gap-3"
                onClick={() => navigate(`/expenses/${group.id}`)}
              >
                <div className="flex justify-between items-start">
                  <div className="font-semibold text-slate-800 text-lg">{group.name}</div>
                  <div className="text-xs text-slate-400">{group.lastActivityDate ? new Date(group.lastActivityDate).toLocaleDateString() : 'Never'}</div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    {group.members && group.members.length > 0 && (
                      <AvatarStack members={group.members} max={3} size="sm" />
                    )}
                  </div>
                  <div className={`font-medium text-sm ${group.userDebt > 0 ? 'text-secondary' : group.userDebt < 0 ? 'text-red-500' : 'text-slate-500'}`}>
                    {group.userDebt > 0 ? `+$${group.userDebt.toFixed(2)}` : group.userDebt < 0 ? `-$${Math.abs(group.userDebt).toFixed(2)}` : 'Settled'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
