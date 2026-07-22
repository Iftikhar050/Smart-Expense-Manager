import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import { prisma } from '../db';
import { requireAuth } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

router.get('/dashboard', asyncHandler(async (req: any, res) => {
  // Find all groups where the current user is an ADMIN
  const adminGroups = await prisma.groupMember.findMany({
    where: { 
      user_id: req.userId,
      role: 'ADMIN'
    },
    select: { group_id: true }
  });
  
  const groupIds = adminGroups.map(g => g.group_id);
  
  // Fetch expenses for these groups
  const expenses = await prisma.expense.findMany({
    where: { group_id: { in: groupIds }, deleted_at: null },
    include: { 
      payer: true, 
      group: true,
      shares: { include: { user: true } }
    },
    orderBy: { created_at: 'desc' },
    take: 100
  });
  
  // Fetch settlements for these groups
  const settlements = await prisma.settlement.findMany({
    where: { group_id: { in: groupIds }, deleted_at: null },
    include: { sender: true, receiver: true, group: true },
    orderBy: { settled_at: 'desc' },
    take: 100
  });
  
  // Calculate Admin Dashboard metrics per group
  const groups = await prisma.group.findMany({
    where: { id: { in: groupIds } }
  });
  
  const groupsData = groups.map(group => {
    const groupExpenses = expenses.filter(e => e.group_id === group.id);
    const groupSettlements = settlements.filter(s => s.group_id === group.id);
    
    const budget = Number(group.budget || 0);
    const spent = groupExpenses.reduce((acc, exp) => acc + Number(exp.amount), 0);
    const remaining = budget - spent;
    
    const activity = [
      ...groupExpenses.map(e => ({ type: 'expense', date: e.created_at, data: e })),
      ...groupSettlements.map(s => ({ type: 'settlement', date: s.settled_at, data: s }))
    ].sort((a, b) => b.date.getTime() - a.date.getTime());
    
    return {
      id: group.id,
      name: group.name,
      budget,
      spent,
      remaining,
      activity
    };
  });
  
  res.json({ groups: groupsData });
}));

export default router;
