import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, DollarSign, List, Receipt, HandCoins, Calculator, Percent, Trash2, Edit2, Undo, X, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { apiFetch } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { Avatar } from '../components/Avatar';
import { Toast, useToast } from '../components/Toast';
import { FilterBar } from '../components/FilterBar';
import { useDebounce } from '../hooks/useDebounce';
import { Badge, SplitTypeBadge } from '../components/Badge';
import { TableSkeleton } from '../components/Skeleton';

export default function GroupFinances() {
  const { id } = useParams();
  const { userId: currentUserId } = useAuth();
  
  const [group, setGroup] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [balances, setBalances] = useState<Record<string, number>>({});
  const [simplifiedDebts, setSimplifiedDebts] = useState<any[]>([]);
  
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDesc, setExpenseDesc] = useState('');
  const [splitType, setSplitType] = useState('EQUAL');
  const [splits, setSplits] = useState<Record<string, string>>({});
  const [paidBy, setPaidBy] = useState('');

  const [showSettleUp, setShowSettleUp] = useState(false);
  const [settleDirection, setSettleDirection] = useState<'i_paid' | 'i_was_paid'>('i_paid');
  const [settleToUser, setSettleToUser] = useState('');
  const [settleAmount, setSettleAmount] = useState('');
  
  const [selectedActivity, setSelectedActivity] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 250);
  const [loading, setLoading] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast, showToast, hideToast } = useToast();

  useEffect(() => {
    if (currentUserId && !paidBy && !editingExpenseId) setPaidBy(currentUserId);
  }, [currentUserId, paidBy, editingExpenseId]);

  const fetchGroupData = async () => {
    try {
      setLoading(true);
      const [groupRes, expRes, balRes, debtRes, setRes] = await Promise.all([
        apiFetch(`/groups/${id}`),
        apiFetch(`/groups/${id}/expenses`),
        apiFetch(`/groups/${id}/balances`),
        apiFetch(`/groups/${id}/simplified-debts`),
        apiFetch(`/groups/${id}/settlements`)
      ]);
      
      const g = await groupRes.json();
      setGroup(g);
      
      const exps = await expRes.json();
      const sets = await setRes.json();
      
      const combined = [
        ...exps.map((e: any) => ({ type: 'expense', id: e.id, date: e.created_at, data: e })),
        ...sets.map((s: any) => ({ type: 'settlement', id: s.id, date: s.settled_at, data: s }))
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      setActivities(combined);
      setBalances(await balRes.json());
      setSimplifiedDebts(await debtRes.json());

      if (!editingExpenseId) {
        const initSplits: Record<string, string> = {};
        g.members?.forEach((m: any) => initSplits[m.user_id] = '');
        setSplits(initSplits);
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to load group data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroupData();
  }, [id]);

  const getUserName = (userId: string) => {
    if (userId === currentUserId) return 'You';
    const member = group?.members?.find((m: any) => m.user_id === userId);
    return member ? member.user.name : 'Unknown';
  };

  const filteredActivities = activities.filter(act => {
    if (debouncedSearch === '') return true;
    const lower = debouncedSearch.toLowerCase();
    if (act.type === 'expense') {
      return act.data.description.toLowerCase().includes(lower) || 
             getUserName(act.data.paid_by).toLowerCase().includes(lower);
    } else {
      return getUserName(act.data.from_user).toLowerCase().includes(lower) ||
             getUserName(act.data.to_user).toLowerCase().includes(lower);
    }
  });

  const [page, setPage] = useState(1);
  const pageSize = 10;
  const paginatedActivities = filteredActivities.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.ceil(filteredActivities.length / pageSize) || 1;

  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseAmount || !expenseDesc) return;
    
    setIsSubmitting(true);
    try {
      const payload: any = {
        amount: parseFloat(expenseAmount),
        description: expenseDesc,
        split_type: splitType,
        paid_by: paidBy
      };
      
      if (splitType !== 'EQUAL') {
        const formattedSplits: any[] = [];
        Object.entries(splits).forEach(([userId, val]) => {
          if (val && parseFloat(val) > 0) {
            formattedSplits.push({ user_id: userId, value: parseFloat(val) });
          }
        });
        payload.splits = formattedSplits;
      }
      
      let res;
      if (editingExpenseId) {
        res = await apiFetch(`/groups/${id}/expenses/${editingExpenseId}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
      } else {
        res = await apiFetch(`/groups/${id}/expenses`, {
          method: 'POST',
          body: JSON.stringify(payload)
        });
      }
      
      if (res.ok) {
        showToast(editingExpenseId ? 'Expense updated' : 'Expense added', 'success');
        setExpenseAmount('');
        setExpenseDesc('');
        setShowAddExpense(false);
        setEditingExpenseId(null);
        fetchGroupData();
      } else {
        const errData = await res.json();
        showToast(errData.error || 'Failed to save expense', 'error');
      }
    } catch (err) {
      showToast('Failed to save expense', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return;
    try {
      const res = await apiFetch(`/groups/${id}/expenses/${expenseId}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Expense deleted', 'success');
        fetchGroupData();
        setSelectedActivity(null);
      } else {
        showToast('Failed to delete expense', 'error');
      }
    } catch (err) {
      showToast('Failed to delete expense', 'error');
    }
  };

  const handleEditExpense = (expense: any) => {
    setEditingExpenseId(expense.id);
    setExpenseAmount(expense.amount.toString());
    setExpenseDesc(expense.description);
    setSplitType(expense.split_type);
    setPaidBy(expense.paid_by);
    
    const newSplits: Record<string, string> = {};
    group.members?.forEach((m: any) => newSplits[m.user_id] = '');
    
    if (expense.split_type !== 'EQUAL') {
      expense.shares?.forEach((share: any) => {
        newSplits[share.user_id] = share.amount_owed.toString(); 
      });
    }
    
    setSplits(newSplits);
    setShowAddExpense(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSettleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settleAmount || !settleToUser) return;
    
    setIsSubmitting(true);
    try {
      const from_user = settleDirection === 'i_paid' ? currentUserId : settleToUser;
      const to_user = settleDirection === 'i_paid' ? settleToUser : currentUserId;
      
      const res = await apiFetch(`/groups/${id}/settlements`, {
        method: 'POST',
        body: JSON.stringify({
          amount: parseFloat(settleAmount),
          from_user_id: from_user,
          to_user_id: to_user
        })
      });
      
      if (res.ok) {
        showToast('Settlement recorded', 'success');
        setSettleAmount('');
        setShowSettleUp(false);
        fetchGroupData();
      } else {
        const errData = await res.json();
        showToast(errData.error || 'Failed to record settlement', 'error');
      }
    } catch (err) {
      showToast('Failed to record settlement', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSettlement = async (settlementId: string) => {
    if (!window.confirm('Are you sure you want to undo this settlement?')) return;
    try {
      const res = await apiFetch(`/groups/${id}/settlements/${settlementId}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Settlement undone', 'success');
        fetchGroupData();
        setSelectedActivity(null);
      } else {
        showToast('Failed to undo settlement', 'error');
      }
    } catch (err) {
      showToast('Failed to undo settlement', 'error');
    }
  };

  if (loading) return <div className="text-center py-12">Loading group finances...</div>;
  if (!group) return null;

  return (
    <div className="max-w-6xl mx-auto">
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      
      <div className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <Link to="/expenses" className="text-primary hover:underline flex items-center mb-2 font-medium">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to group expenses
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-800">{group.name} Finances</h1>
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => {
              if (!showSettleUp) {
                setSettleToUser('');
                setSettleAmount('');
              }
              setShowSettleUp(!showSettleUp);
              setShowAddExpense(false);
            }} 
            className="bg-accent text-white px-4 py-2 rounded-lg font-medium hover:bg-opacity-90 transition shadow-sm flex items-center"
          >
            <HandCoins className="w-4 h-4 mr-2" />
            Settle up
          </button>
          <button 
            onClick={() => {
              if (!showAddExpense) {
                setEditingExpenseId(null);
                setExpenseAmount('');
                setExpenseDesc('');
                setSplitType('EQUAL');
                const initSplits: Record<string, string> = {};
                group.members?.forEach((m: any) => initSplits[m.user_id] = '');
                setSplits(initSplits);
              }
              setShowAddExpense(!showAddExpense);
              setShowSettleUp(false);
            }} 
            className="bg-secondary text-white px-4 py-2 rounded-lg font-medium hover:bg-opacity-90 transition shadow-sm flex items-center"
          >
            {showAddExpense && !editingExpenseId ? <X className="w-4 h-4 mr-2" /> : <Receipt className="w-4 h-4 mr-2" />}
            {showAddExpense && !editingExpenseId ? 'Cancel' : 'Add expense'}
          </button>
        </div>
      </div>

      {showSettleUp && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-accent/20 mb-8 max-w-2xl mx-auto ring-1 ring-accent/10">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center text-lg"><HandCoins className="w-5 h-5 mr-2 text-accent" /> Record a payment</h3>
          <form onSubmit={handleSettleSubmit} className="space-y-4">
            <div className="flex items-center gap-2">
              <select 
                value={settleDirection} 
                onChange={(e: any) => setSettleDirection(e.target.value)}
                className="p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-accent outline-none font-medium text-slate-700 bg-slate-50"
              >
                <option value="i_paid">You paid</option>
                <option value="i_was_paid">You were paid by</option>
              </select>
              
              <select 
                value={settleToUser} 
                onChange={(e) => setSettleToUser(e.target.value)}
                required
                className="flex-1 p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-accent outline-none font-medium text-slate-700 bg-slate-50"
              >
                <option value="" disabled>Select member...</option>
                {group.members?.filter((m: any) => m.user_id !== currentUserId).map((m: any) => (
                  <option key={m.user_id} value={m.user_id}>{m.user.name}</option>
                ))}
              </select>
            </div>
            
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span className="text-slate-500 font-bold text-lg">$</span>
              </div>
              <input 
                type="number" 
                step="0.01" 
                min="0.01"
                value={settleAmount} 
                onChange={e => setSettleAmount(e.target.value)} 
                placeholder="0.00" 
                required
                className="w-full pl-8 p-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-accent outline-none text-lg font-bold shadow-sm"
              />
            </div>
            <button disabled={isSubmitting} type="submit" className="w-full bg-accent text-white py-3 rounded-md font-bold hover:bg-opacity-90 transition disabled:opacity-50 shadow-sm text-lg mt-2">
              {isSubmitting ? 'Recording...' : 'Save Payment'}
            </button>
          </form>
        </div>
      )}

      {showAddExpense && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-secondary/20 mb-8 max-w-2xl mx-auto ring-1 ring-secondary/10">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-slate-800 flex items-center text-lg">
              <Receipt className="w-5 h-5 mr-2 text-secondary" /> 
              {editingExpenseId ? 'Edit Expense' : 'Add an expense'}
            </h3>
            {editingExpenseId && (
              <button onClick={() => { setShowAddExpense(false); setEditingExpenseId(null); }} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
          
          <form onSubmit={handleExpenseSubmit} className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <input 
                  type="text" 
                  value={expenseDesc} 
                  onChange={e => setExpenseDesc(e.target.value)} 
                  placeholder="Enter a description" 
                  required
                  className="w-full p-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-secondary outline-none shadow-sm"
                />
              </div>
              <div className="relative w-1/3">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-slate-500 font-bold">$</span>
                </div>
                <input 
                  type="number" 
                  step="0.01" 
                  min="0.01"
                  value={expenseAmount} 
                  onChange={e => setExpenseAmount(e.target.value)} 
                  placeholder="0.00" 
                  required
                  className="w-full pl-8 p-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-secondary outline-none font-bold shadow-sm"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm bg-slate-50 p-3 rounded border border-slate-100">
              <span className="text-slate-600 font-medium">Paid by</span>
              <select 
                value={paidBy} 
                onChange={(e) => setPaidBy(e.target.value)}
                className="p-1.5 border border-slate-300 rounded focus:ring-2 focus:ring-secondary outline-none font-medium bg-white"
              >
                {group.members?.map((m: any) => (
                  <option key={m.user_id} value={m.user_id}>{m.user_id === currentUserId ? 'You' : m.user.name}</option>
                ))}
              </select>
              <span className="text-slate-600 font-medium">and split</span>
              <select 
                value={splitType} 
                onChange={(e) => setSplitType(e.target.value)}
                className="p-1.5 border border-slate-300 rounded focus:ring-2 focus:ring-secondary outline-none font-medium bg-white"
              >
                <option value="EQUAL">equally</option>
                <option value="EXACT">by exact amounts</option>
                <option value="PERCENTAGE">by percentages</option>
                <option value="SHARES">by shares</option>
              </select>
            </div>

            {splitType !== 'EQUAL' && (
              <div className="bg-slate-50 p-4 rounded border border-slate-200 mt-2">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3 flex items-center">
                  {splitType === 'EXACT' && <DollarSign className="w-3 h-3 mr-1" />}
                  {splitType === 'PERCENTAGE' && <Percent className="w-3 h-3 mr-1" />}
                  {splitType === 'SHARES' && <Calculator className="w-3 h-3 mr-1" />}
                  Split {splitType.toLowerCase()}
                </div>
                <div className="space-y-2">
                  {group.members?.map((m: any) => (
                    <div key={m.user_id} className="flex items-center justify-between gap-4 bg-white p-2 border border-slate-100 rounded shadow-sm">
                      <div className="flex items-center gap-2">
                        <Avatar name={getUserName(m.user_id)} size="sm" />
                        <span className="text-sm font-medium text-slate-700">{getUserName(m.user_id)}</span>
                      </div>
                      <div className="relative w-1/3 min-w-[100px]">
                        {splitType === 'EXACT' && <span className="absolute inset-y-0 left-0 pl-2 flex items-center text-slate-500">$</span>}
                        <input 
                          type="number" 
                          step="0.01"
                          min="0"
                          value={splits[m.user_id] || ''} 
                          onChange={(e) => setSplits({ ...splits, [m.user_id]: e.target.value })}
                          placeholder="0"
                          className={`w-full p-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-secondary outline-none text-right ${splitType === 'EXACT' ? 'pl-6' : 'pr-6'}`}
                        />
                        {splitType === 'PERCENTAGE' && <span className="absolute inset-y-0 right-0 pr-2 flex items-center text-slate-500">%</span>}
                        {splitType === 'SHARES' && <span className="absolute inset-y-0 right-0 pr-2 flex items-center text-slate-400 text-xs">sh</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button disabled={isSubmitting} type="submit" className="w-full bg-secondary text-white py-3 rounded-md font-bold hover:bg-opacity-90 transition disabled:opacity-50 shadow-sm mt-4">
              {isSubmitting ? 'Saving...' : (editingExpenseId ? 'Update Expense' : 'Save Expense')}
            </button>
          </form>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
            <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center"><Receipt className="w-5 h-5 mr-2 text-primary" /> Expenses & Settlements</h3>
            
            <div className="mb-4">
              <FilterBar 
                value={search} 
                onChange={setSearch} 
                placeholder="Search activity by description or who paid..." 
              />
            </div>

            {loading ? (
              <TableSkeleton rows={4} />
            ) : activities.length === 0 ? (
              <p className="text-slate-500 text-center py-8 bg-slate-50 rounded-lg border border-slate-100">No activity yet.</p>
            ) : filteredActivities.length === 0 ? (
              <div className="text-center py-8 bg-slate-50 rounded-lg border border-slate-100 text-slate-500">
                No activity matches "{search}".
                <button onClick={() => setSearch('')} className="block mt-2 mx-auto text-primary hover:underline">Clear filter</button>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                {/* Desktop Table View */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-y border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                        <th className="p-3 w-10"></th>
                        <th className="p-3">Description</th>
                        <th className="p-3">Who</th>
                        <th className="p-3 text-right">Amount</th>
                        <th className="p-3 w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {paginatedActivities.map(act => {
                        const isExpanded = selectedActivity === act.id;
                        return (
                          <React.Fragment key={act.id}>
                            <tr 
                              className={`hover:bg-slate-50 transition cursor-pointer group ${act.type === 'settlement' ? 'border-l-4 border-l-accent' : ''}`}
                              onClick={() => setSelectedActivity(isExpanded ? null : act.id)}
                            >
                              <td className="p-4">
                                <div className={`p-2 rounded-full inline-block ${act.type === 'expense' ? 'bg-secondary/10 text-secondary' : 'bg-accent/10 text-accent'}`}>
                                  {act.type === 'expense' ? <Receipt className="w-4 h-4" /> : <HandCoins className="w-4 h-4" />}
                                </div>
                              </td>
                              <td className="p-4">
                                <div className="font-semibold text-slate-800 flex items-center gap-2">
                                  {act.type === 'expense' ? act.data.description : 'Payment'}
                                  {act.type === 'expense' && act.data.category && (
                                    <Badge variant="secondary">{act.data.category}</Badge>
                                  )}
                                </div>
                                <div className="text-xs text-slate-400 mt-1">{new Date(act.date).toLocaleDateString()}</div>
                              </td>
                              <td className="p-4 text-sm text-slate-600">
                                {act.type === 'expense' ? (
                                  <div className="flex flex-col items-start gap-1">
                                    <div className="flex items-center gap-2">
                                      <Avatar name={getUserName(act.data.paid_by)} size="sm" />
                                      <span><span className="font-medium text-slate-800">{getUserName(act.data.paid_by)}</span> paid</span>
                                    </div>
                                    <SplitTypeBadge type={act.data.split_type} />
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <Avatar name={getUserName(act.data.from_user)} size="sm" />
                                    <span>{getUserName(act.data.from_user)} &rarr;</span>
                                    <Avatar name={getUserName(act.data.to_user)} size="sm" />
                                    <span>{getUserName(act.data.to_user)}</span>
                                  </div>
                                )}
                              </td>
                              <td className="p-4 text-right font-bold text-slate-800">
                                ${parseFloat(act.data.amount).toFixed(2)}
                              </td>
                              <td className="p-4 text-slate-400 text-right">
                                <ChevronDown className={`w-4 h-4 inline-block transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                              </td>
                            </tr>
                            
                            {isExpanded && (
                              <tr className="bg-slate-50">
                                <td colSpan={5} className="p-4 border-b border-slate-200">
                                  <div className="bg-white p-4 rounded border border-slate-200 shadow-sm relative">
                                    {act.type === 'expense' ? (
                                      <>
                                        <div className="flex justify-between items-center mb-4">
                                          <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500">Split Details</h5>
                                          <div className="flex gap-2">
                                            <button onClick={(e) => { e.stopPropagation(); handleEditExpense(act.data); }} className="text-slate-400 hover:text-primary transition p-1" title="Edit">
                                              <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button onClick={(e) => { e.stopPropagation(); handleDeleteExpense(act.id); }} className="text-slate-400 hover:text-red-500 transition p-1" title="Delete">
                                              <Trash2 className="w-4 h-4" />
                                            </button>
                                          </div>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                          {act.data.shares?.map((share: any) => (
                                            <div key={share.id} className="flex justify-between items-center bg-slate-50 p-2 rounded text-sm">
                                              <div className="flex items-center gap-2">
                                                <Avatar name={getUserName(share.user_id)} size="sm" />
                                                <span className="text-slate-700 font-medium">{getUserName(share.user_id)}</span>
                                              </div>
                                              <span className="font-bold text-slate-800">${parseFloat(share.amount_owed).toFixed(2)}</span>
                                            </div>
                                          ))}
                                        </div>
                                      </>
                                    ) : (
                                      <>
                                        <div className="flex justify-between items-center mb-2">
                                          <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500">Settlement</h5>
                                          <button onClick={(e) => { e.stopPropagation(); handleDeleteSettlement(act.id); }} className="flex items-center text-slate-400 hover:text-red-500 transition text-xs font-medium px-2 py-1 bg-slate-50 border rounded">
                                            <Undo className="w-3 h-3 mr-1" /> Undo
                                          </button>
                                        </div>
                                        <p className="text-sm text-slate-700 mt-2">
                                          {act.data.note ? <span className="italic">"{act.data.note}"</span> : 'No note attached.'}
                                        </p>
                                      </>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="block sm:hidden divide-y divide-slate-100">
                  {paginatedActivities.map(act => {
                    const isExpanded = selectedActivity === act.id;
                    return (
                      <div key={act.id} className={`flex flex-col ${act.type === 'settlement' ? 'border-l-4 border-l-accent' : ''}`}>
                        <div 
                          className="p-4 hover:bg-slate-50 transition cursor-pointer"
                          onClick={() => setSelectedActivity(isExpanded ? null : act.id)}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div className="font-semibold text-slate-800 flex flex-col gap-1">
                              <span>{act.type === 'expense' ? act.data.description : 'Payment'}</span>
                              <div className="flex items-center gap-2">
                                {act.type === 'expense' && <SplitTypeBadge type={act.data.split_type} />}
                                {act.type === 'expense' && act.data.category && <Badge variant="secondary">{act.data.category}</Badge>}
                                {act.type === 'settlement' && <Badge variant="accent">Payment</Badge>}
                              </div>
                            </div>
                            <div className="text-right flex flex-col items-end">
                              <span className="font-bold text-slate-800">${parseFloat(act.data.amount).toFixed(2)}</span>
                              <span className="text-xs text-slate-400">{new Date(act.date).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-sm text-slate-600 mt-3">
                            {act.type === 'expense' ? (
                              <div className="flex items-center gap-2">
                                <Avatar name={getUserName(act.data.paid_by)} size="sm" />
                                <span><span className="font-medium text-slate-800">{getUserName(act.data.paid_by)}</span> paid</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <Avatar name={getUserName(act.data.from_user)} size="sm" />
                                <span>&rarr;</span>
                                <Avatar name={getUserName(act.data.to_user)} size="sm" />
                              </div>
                            )}
                            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="bg-slate-50 p-4 border-t border-slate-100">
                            {act.type === 'expense' ? (
                              <>
                                <div className="flex justify-between items-center mb-3">
                                  <h5 className="text-xs font-bold uppercase tracking-wide text-slate-500">Split Details</h5>
                                  <div className="flex gap-2">
                                    <button onClick={(e) => { e.stopPropagation(); handleEditExpense(act.data); }} className="text-slate-400 hover:text-primary transition p-1">
                                      <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button onClick={(e) => { e.stopPropagation(); handleDeleteExpense(act.id); }} className="text-slate-400 hover:text-red-500 transition p-1">
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  {act.data.shares?.map((share: any) => (
                                    <div key={share.id} className="flex justify-between items-center bg-white border border-slate-200 p-2 rounded text-sm">
                                      <div className="flex items-center gap-2">
                                        <Avatar name={getUserName(share.user_id)} size="sm" />
                                        <span className="text-slate-700 font-medium">{getUserName(share.user_id)}</span>
                                      </div>
                                      <span className="font-bold text-slate-800">${parseFloat(share.amount_owed).toFixed(2)}</span>
                                    </div>
                                  ))}
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="flex justify-between items-center mb-2">
                                  <h5 className="text-xs font-bold uppercase tracking-wide text-slate-500">Settlement</h5>
                                  <button onClick={(e) => { e.stopPropagation(); handleDeleteSettlement(act.id); }} className="flex items-center text-slate-400 hover:text-red-500 transition text-xs font-medium px-2 py-1 bg-white border rounded">
                                    <Undo className="w-3 h-3 mr-1" /> Undo
                                  </button>
                                </div>
                                <p className="text-sm text-slate-700 mt-2">
                                  {act.data.note ? <span className="italic">"{act.data.note}"</span> : 'No note attached.'}
                                </p>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {totalPages > 1 && (
              <div className="bg-slate-50 px-4 py-3 flex items-center justify-between border-t border-slate-200 sm:px-6 rounded-b-lg">
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-slate-700">
                      Showing page <span className="font-medium">{page}</span> of <span className="font-medium">{totalPages}</span>
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-slate-300 bg-white text-sm font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="sr-only">Previous</span>
                        <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                      </button>
                      <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-slate-300 bg-white text-sm font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="sr-only">Next</span>
                        <ChevronRight className="h-5 w-5" aria-hidden="true" />
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center"><List className="w-4 h-4 mr-2 text-primary" /> Simplified Debts</h3>
            {simplifiedDebts.length === 0 ? (
              <p className="text-slate-500 text-sm bg-slate-50 p-4 rounded text-center border border-slate-100">Everyone is settled up!</p>
            ) : (
              <div className="flex flex-col gap-2">
                {simplifiedDebts.map((debt, idx) => (
                  <div key={idx} className="flex flex-row items-center justify-between bg-slate-50 p-3 rounded border border-slate-100 hover:bg-slate-100 transition">
                    <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 pr-2">
                      <div className="flex-shrink-0">
                        <Avatar name={getUserName(debt.from)} size="sm" />
                      </div>
                      <div className="flex flex-wrap items-center gap-x-1 text-sm text-slate-600 min-w-0">
                        <span className="font-medium text-slate-800 truncate max-w-[80px] sm:max-w-[120px]" title={getUserName(debt.from)}>{getUserName(debt.from)}</span>
                        <span>owes</span>
                        <span className="font-medium text-slate-800 truncate max-w-[80px] sm:max-w-[120px]" title={getUserName(debt.to)}>{getUserName(debt.to)}</span>
                      </div>
                    </div>
                    <div className="text-right text-accent font-bold flex-shrink-0 whitespace-nowrap">${debt.amount.toFixed(2)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center"><DollarSign className="w-4 h-4 mr-2 text-primary" /> Raw Balances</h3>
            <ul className="space-y-2 mb-4 text-sm">
              {Object.entries(balances).map(([userId, balance]) => {
                const userDebts = simplifiedDebts.filter(d => d.from === userId || d.to === userId);
                const isSelected = selectedUser === userId;
                
                return (
                  <li key={userId} className="border-b pb-2 last:border-0">
                    <div 
                      className="flex justify-between items-center cursor-pointer hover:bg-slate-50 p-2 -mx-2 rounded transition"
                      onClick={() => setSelectedUser(isSelected ? null : userId)}
                    >
                      <div className="flex items-center gap-2">
                        <Avatar name={getUserName(userId)} size="sm" />
                        <span className="text-slate-700 font-medium">{getUserName(userId)}</span>
                      </div>
                      <span className={`font-semibold ${balance > 0 ? 'text-green-600' : balance < 0 ? 'text-red-600' : 'text-slate-500'}`}>
                        {balance > 0 ? '+' : ''}{balance.toFixed(2)}
                      </span>
                    </div>
                    
                    {isSelected && (
                      <div className="bg-slate-50 p-3 mt-1 rounded text-xs border border-slate-100">
                        <div className="font-bold text-slate-500 mb-2 uppercase tracking-wide">Specific Debts</div>
                        {userDebts.length === 0 ? (
                          <div className="text-slate-400">No active debts</div>
                        ) : (
                          <ul className="space-y-1">
                            {userDebts.map((d, i) => (
                              <li key={i} className="flex justify-between items-center py-1 border-b last:border-0 border-slate-200">
                                <span className="flex items-center gap-1.5">
                                  {d.from === userId ? 'Owes ' : 'Is owed by '} 
                                  <span className="font-medium text-slate-700 flex items-center gap-1">
                                    <Avatar name={getUserName(d.from === userId ? d.to : d.from)} size="sm" className="w-4 h-4 text-[10px]" />
                                    {getUserName(d.from === userId ? d.to : d.from)}
                                  </span>
                                </span>
                                <span className={d.from === userId ? 'text-red-600' : 'text-green-600'}>
                                  ${d.amount.toFixed(2)}
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
