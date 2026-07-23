import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import { prisma } from '../db';
import { requireAuth } from '../middleware/auth';
import { calculateNetBalances } from '../utils/balances';
import { simplifyDebts } from '../utils/simplification';
import { Decimal } from 'decimal.js';

const router = Router();
router.use(requireAuth);

router.get('/dashboard', asyncHandler(async (req: any, res) => {
  const userGroups = await prisma.groupMember.findMany({
    where: { user_id: req.userId },
    select: { group_id: true }
  });
  
  const groupIds = userGroups.map(g => g.group_id);
  
  const groups = await prisma.group.findMany({
    where: { id: { in: groupIds } },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, email: true } } }
      },
      expenses: {
        where: { deleted_at: null },
        include: { shares: true, payer: { select: { id: true, name: true } } }
      },
      settlements: { where: { deleted_at: null } }
    }
  });

  let totalBalance = new Decimal(0);
  let totalOwed = new Decimal(0); 
  let totalOwe = new Decimal(0);  
  
  const userBalances: Record<string, { name: string, balance: Decimal }> = {};
  const groupDetails: any[] = [];
  
  for (const group of groups) {
    const userIds = group.members.map(m => m.user_id);
    const shares = group.expenses.flatMap(e => e.shares);
    
    const balances = calculateNetBalances(userIds, group.expenses, shares, group.settlements);
    const simplified = simplifyDebts(balances);
    
    let groupSpent = new Decimal(0);
    const memberSpent: Record<string, Decimal> = {};
    for (const exp of group.expenses) {
      groupSpent = groupSpent.plus(exp.amount);
      if (!memberSpent[exp.paid_by]) {
        memberSpent[exp.paid_by] = new Decimal(0);
      }
      memberSpent[exp.paid_by] = memberSpent[exp.paid_by].plus(exp.amount);
    }
    
    let userGroupDebt = new Decimal(0);
    if (balances[req.userId]) {
      userGroupDebt = balances[req.userId];
    }
    
    const membersSpending = Object.entries(memberSpent).map(([userId, spent]) => {
      const user = group.members.find(m => m.user_id === userId)?.user;
      return {
        id: userId,
        name: user?.name || 'Unknown',
        spent: spent.toNumber()
      };
    });

    let lastActivityDate = group.created_at;
    const lastExp = group.expenses.sort((a, b) => b.created_at.getTime() - a.created_at.getTime())[0];
    const lastSet = group.settlements.sort((a, b) => b.settled_at.getTime() - a.settled_at.getTime())[0];
    if (lastExp && lastExp.created_at > lastActivityDate) lastActivityDate = lastExp.created_at;
    if (lastSet && lastSet.settled_at > lastActivityDate) lastActivityDate = lastSet.settled_at;

    const activity = [
      ...group.expenses.map(e => ({ type: 'expense', date: e.created_at, data: e })),
      ...group.settlements.map(s => ({ 
        type: 'settlement', 
        date: s.settled_at, 
        data: {
          ...s,
          sender: group.members.find(m => m.user_id === s.from_user)?.user,
          receiver: group.members.find(m => m.user_id === s.to_user)?.user
        }
      }))
    ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 10);

    groupDetails.push({
      id: group.id,
      name: group.name,
      budget: Number(group.budget || 0),
      totalSpent: groupSpent.toNumber(),
      userDebt: userGroupDebt.toNumber(),
      membersSpending,
      lastActivityDate,
      memberCount: group.members.length,
      myRole: group.members.find(m => m.user_id === req.userId)?.role,
      members: group.members.map(m => ({ id: m.user.id, name: m.user.name })),
      activity
    });
    
    for (const debt of simplified) {
      if (debt.from === req.userId || debt.to === req.userId) {
        const otherUserId = debt.from === req.userId ? debt.to : debt.from;
        const otherUser = group.members.find(m => m.user_id === otherUserId)?.user;
        
        if (!userBalances[otherUserId]) {
          userBalances[otherUserId] = { name: otherUser?.name || 'Unknown', balance: new Decimal(0) };
        }
        
        if (debt.from === req.userId) {
          userBalances[otherUserId].balance = userBalances[otherUserId].balance.minus(debt.amount);
          totalOwe = totalOwe.plus(debt.amount);
          totalBalance = totalBalance.minus(debt.amount);
        } else {
          userBalances[otherUserId].balance = userBalances[otherUserId].balance.plus(debt.amount);
          totalOwed = totalOwed.plus(debt.amount);
          totalBalance = totalBalance.plus(debt.amount);
        }
      }
    }
  }
  
  const friendsList = Object.entries(userBalances).map(([id, data]) => ({
    id,
    name: data.name,
    balance: data.balance.toNumber()
  })).filter(f => Math.abs(f.balance) > 0.01);
  
  res.json({
    totalBalance: totalBalance.toNumber(),
    totalOwed: totalOwed.toNumber(),
    totalOwe: totalOwe.toNumber(),
    friends: friendsList,
    groupDetails
  });
}));

router.get('/activity', asyncHandler(async (req: any, res) => {
  const userGroups = await prisma.groupMember.findMany({
    where: { user_id: req.userId },
    select: { group_id: true }
  });
  const groupIds = userGroups.map(g => g.group_id);
  
  const [expenses, settlements] = await Promise.all([
    prisma.expense.findMany({
      where: { group_id: { in: groupIds }, deleted_at: null },
      include: { group: true, shares: { include: { user: true } }, payer: true },
      orderBy: { created_at: 'desc' },
      take: 50
    }),
    prisma.settlement.findMany({
      where: { group_id: { in: groupIds }, deleted_at: null },
      include: { group: true, sender: true, receiver: true },
      orderBy: { settled_at: 'desc' },
      take: 50
    })
  ]);
  
  const activity = [
    ...expenses.map(e => ({ type: 'expense', date: e.created_at, data: e })),
    ...settlements.map(s => ({ type: 'settlement', date: s.settled_at, data: s }))
  ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 50);
  
  res.json(activity);
}));

router.get('/expenses', asyncHandler(async (req: any, res) => {
  const userGroups = await prisma.groupMember.findMany({
    where: { user_id: req.userId },
    select: { group_id: true }
  });
  const groupIds = userGroups.map(g => g.group_id);
  
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const search = (req.query.search as string) || '';
  
  const skip = (page - 1) * limit;
  
  const whereClause: any = { 
    group_id: { in: groupIds }, 
    deleted_at: null 
  };
  
  if (search) {
    whereClause.description = { contains: search, mode: 'insensitive' };
  }

  const [expenses, total] = await Promise.all([
    prisma.expense.findMany({
      where: whereClause,
      include: { 
        payer: { select: { id: true, name: true } }, 
        group: { select: { id: true, name: true } },
        shares: {
          include: { user: { select: { id: true, name: true } } }
        }
      },
      orderBy: { created_at: 'desc' },
      skip,
      take: limit
    }),
    prisma.expense.count({ where: whereClause })
  ]);
  
  res.json({
    data: expenses,
    total,
    page,
    totalPages: Math.ceil(total / limit)
  });
}));

export default router;
// trigger ide update
