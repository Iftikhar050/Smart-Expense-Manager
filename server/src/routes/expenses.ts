import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import { prisma } from '../db';
import { requireAuth } from '../middleware/auth';
import { Decimal } from 'decimal.js';

const parseVal = (v: any) => {
  if (v == null) return 0;
  const num = Number(v);
  return isNaN(num) ? 0 : num;
};

const router = Router({ mergeParams: true });
router.use(requireAuth);

router.post('/', asyncHandler(async (req: any, res) => {
  const { id: group_id } = req.params;
  const { amount, description, category, split_type = 'EQUAL', splits, paid_by } = req.body;
  
  if (!amount || !description) {
    res.status(400).json({ error: 'Amount and description required' });
    return;
  }
  
  const desc = description.trim();
  if (desc.length < 2 || desc.length > 100) {
    res.status(400).json({ error: 'Description must be between 2 and 100 characters' });
    return;
  }
  
  const amountVal = parseFloat(amount);
  if (isNaN(amountVal) || amountVal <= 0) {
    res.status(400).json({ error: 'Amount must be greater than 0' });
    return;
  }
  
  const group = await prisma.group.findUnique({
    where: { id: group_id },
    include: { members: { orderBy: { joined_at: 'asc' } } }
  });
  
  if (!group) {
    res.status(404).json({ error: 'Group not found' });
    return;
  }
  
  const memberCount = group.members.length;
  if (memberCount === 0) {
    res.status(400).json({ error: 'Group has no members' });
    return;
  }
  
  const currentUserMember = group.members.find(m => m.user_id === req.userId);
  if (!currentUserMember || currentUserMember.role === 'VIEWER') {
    res.status(403).json({ error: 'Viewers cannot create expenses' });
    return;
  }
  
  const totalAmount = new Decimal(amount);
  let sharesData: { user_id: string, amount_owed: number }[] = [];
  
  if (split_type === 'EQUAL') {
    const baseShare = totalAmount.dividedBy(memberCount).toDecimalPlaces(2, Decimal.ROUND_FLOOR);
    let remainderCents = Math.round(totalAmount.minus(baseShare.times(memberCount)).times(100).toNumber());
    
    sharesData = group.members.map((member) => {
      let shareAmount = baseShare;
      if (remainderCents > 0) {
        shareAmount = shareAmount.plus(new Decimal(0.01));
        remainderCents -= 1;
      }
      return {
        user_id: member.user_id,
        amount_owed: shareAmount.toNumber()
      };
    });
  } else if (split_type === 'EXACT') {
    if (!splits || !Array.isArray(splits)) {
      res.status(400).json({ error: 'Splits required for EXACT' });
      return;
    }
    const sum = splits.reduce((acc: Decimal, s: any) => acc.plus(new Decimal(parseVal(s.value))), new Decimal(0));
    if (!sum.equals(totalAmount)) {
      res.status(400).json({ error: 'Exact amounts must sum exactly to the total amount' });
      return;
    }
    sharesData = splits.map((s: any) => ({
      user_id: s.user_id,
      amount_owed: new Decimal(parseVal(s.value)).toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber()
    }));
  } else if (split_type === 'PERCENTAGE') {
    if (!splits || !Array.isArray(splits)) {
      res.status(400).json({ error: 'Splits required for PERCENTAGE' });
      return;
    }
    const sum = splits.reduce((acc: Decimal, s: any) => acc.plus(new Decimal(parseVal(s.value))), new Decimal(0));
    if (!sum.equals(new Decimal(100))) {
      res.status(400).json({ error: 'Percentages must sum to 100' });
      return;
    }
    
    let calculatedSum = new Decimal(0);
    const calculatedShares = splits.map((s: any) => {
      const share = totalAmount.times(new Decimal(parseVal(s.value))).dividedBy(100).toDecimalPlaces(2, Decimal.ROUND_FLOOR);
      calculatedSum = calculatedSum.plus(share);
      return { user_id: s.user_id, amount: share };
    });
    
    let remainderCents = Math.round(totalAmount.minus(calculatedSum).times(100).toNumber());
    
    sharesData = calculatedShares.map(s => {
      let shareAmount = s.amount;
      if (remainderCents > 0) {
        shareAmount = shareAmount.plus(new Decimal(0.01));
        remainderCents -= 1;
      }
      return { user_id: s.user_id, amount_owed: shareAmount.toNumber() };
    });
  } else if (split_type === 'SHARES') {
    if (!splits || !Array.isArray(splits)) {
      res.status(400).json({ error: 'Splits required for SHARES' });
      return;
    }
    const totalShares = splits.reduce((acc: Decimal, s: any) => acc.plus(new Decimal(parseVal(s.value))), new Decimal(0));
    if (totalShares.equals(0)) {
      res.status(400).json({ error: 'Total shares must be greater than 0' });
      return;
    }
    
    let calculatedSum = new Decimal(0);
    const calculatedShares = splits.map((s: any) => {
      const share = totalAmount.times(new Decimal(parseVal(s.value))).dividedBy(totalShares).toDecimalPlaces(2, Decimal.ROUND_FLOOR);
      calculatedSum = calculatedSum.plus(share);
      return { user_id: s.user_id, amount: share };
    });
    
    let remainderCents = Math.round(totalAmount.minus(calculatedSum).times(100).toNumber());
    
    sharesData = calculatedShares.map(s => {
      let shareAmount = s.amount;
      if (remainderCents > 0) {
        shareAmount = shareAmount.plus(new Decimal(0.01));
        remainderCents -= 1;
      }
      return { user_id: s.user_id, amount_owed: shareAmount.toNumber() };
    });
  } else {
    res.status(400).json({ error: 'Invalid split type' });
    return;
  }
  
  const expense = await prisma.$transaction(async (tx) => {
    const newExpense = await tx.expense.create({
      data: {
        group_id,
        paid_by: paid_by || req.userId,
        amount: totalAmount.toNumber(),
        description,
        category: category || null,
        split_type,
        created_by: req.userId,
        shares: {
          create: sharesData
        }
      }
    });
    return newExpense;
  });
  
  res.json(expense);
}));

router.get('/', asyncHandler(async (req: any, res) => {
  const { id: group_id } = req.params;
  
  const expenses = await prisma.expense.findMany({
    where: { group_id },
    include: {
      payer: { select: { id: true, name: true } },
      shares: { include: { user: { select: { id: true, name: true } } } }
    },
    orderBy: { created_at: 'desc' }
  });
  
  res.json(expenses);
}));

router.put('/:expenseId', asyncHandler(async (req: any, res) => {
  const { id: group_id, expenseId } = req.params;
  const { amount, description, category, split_type = 'EQUAL', splits, paid_by } = req.body;
  
  if (!amount || !description) {
    res.status(400).json({ error: 'Amount and description required' });
    return;
  }
  
  const desc = description.trim();
  if (desc.length < 2 || desc.length > 100) {
    res.status(400).json({ error: 'Description must be between 2 and 100 characters' });
    return;
  }
  
  const amountVal = parseFloat(amount);
  if (isNaN(amountVal) || amountVal <= 0) {
    res.status(400).json({ error: 'Amount must be greater than 0' });
    return;
  }
  
  const existingExpense = await prisma.expense.findUnique({ where: { id: expenseId } });
  if (!existingExpense || existingExpense.group_id !== group_id || existingExpense.deleted_at !== null) {
    res.status(404).json({ error: 'Expense not found' });
    return;
  }
  
  const group = await prisma.group.findUnique({
    where: { id: group_id },
    include: { members: { orderBy: { joined_at: 'asc' } } }
  });
  if (!group) {
    res.status(404).json({ error: 'Group not found' });
    return;
  }
  
  const memberCount = group.members.length;
  if (memberCount === 0) {
    res.status(400).json({ error: 'Group has no members' });
    return;
  }
  
  const currentUserMember = group.members.find(m => m.user_id === req.userId);
  if (!currentUserMember || currentUserMember.role === 'VIEWER') {
    res.status(403).json({ error: 'Viewers cannot edit expenses' });
    return;
  }
  
  const totalAmount = new Decimal(amount);
  let sharesData: { user_id: string, amount_owed: number }[] = [];
  
  if (split_type === 'EQUAL') {
    const baseShare = totalAmount.dividedBy(memberCount).toDecimalPlaces(2, Decimal.ROUND_FLOOR);
    let remainderCents = Math.round(totalAmount.minus(baseShare.times(memberCount)).times(100).toNumber());
    
    sharesData = group.members.map((member) => {
      let shareAmount = baseShare;
      if (remainderCents > 0) {
        shareAmount = shareAmount.plus(new Decimal(0.01));
        remainderCents -= 1;
      }
      return {
        user_id: member.user_id,
        amount_owed: shareAmount.toNumber()
      };
    });
  } else if (split_type === 'EXACT') {
    if (!splits || !Array.isArray(splits)) {
      res.status(400).json({ error: 'Splits required for EXACT' });
      return;
    }
    const sum = splits.reduce((acc: Decimal, s: any) => acc.plus(new Decimal(parseVal(s.value))), new Decimal(0));
    if (!sum.equals(totalAmount)) {
      res.status(400).json({ error: 'Exact amounts must sum exactly to the total amount' });
      return;
    }
    sharesData = splits.map((s: any) => ({
      user_id: s.user_id,
      amount_owed: new Decimal(parseVal(s.value)).toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber()
    }));
  } else if (split_type === 'PERCENTAGE') {
    if (!splits || !Array.isArray(splits)) {
      res.status(400).json({ error: 'Splits required for PERCENTAGE' });
      return;
    }
    const sum = splits.reduce((acc: Decimal, s: any) => acc.plus(new Decimal(parseVal(s.value))), new Decimal(0));
    if (!sum.equals(new Decimal(100))) {
      res.status(400).json({ error: 'Percentages must sum to 100' });
      return;
    }
    
    let calculatedSum = new Decimal(0);
    const calculatedShares = splits.map((s: any) => {
      const share = totalAmount.times(new Decimal(parseVal(s.value))).dividedBy(100).toDecimalPlaces(2, Decimal.ROUND_FLOOR);
      calculatedSum = calculatedSum.plus(share);
      return { user_id: s.user_id, amount: share };
    });
    
    let remainderCents = Math.round(totalAmount.minus(calculatedSum).times(100).toNumber());
    
    sharesData = calculatedShares.map(s => {
      let shareAmount = s.amount;
      if (remainderCents > 0) {
        shareAmount = shareAmount.plus(new Decimal(0.01));
        remainderCents -= 1;
      }
      return { user_id: s.user_id, amount_owed: shareAmount.toNumber() };
    });
  } else if (split_type === 'SHARES') {
    if (!splits || !Array.isArray(splits)) {
      res.status(400).json({ error: 'Splits required for SHARES' });
      return;
    }
    const totalShares = splits.reduce((acc: Decimal, s: any) => acc.plus(new Decimal(parseVal(s.value))), new Decimal(0));
    if (totalShares.equals(0)) {
      res.status(400).json({ error: 'Total shares must be greater than 0' });
      return;
    }
    
    let calculatedSum = new Decimal(0);
    const calculatedShares = splits.map((s: any) => {
      const share = totalAmount.times(new Decimal(parseVal(s.value))).dividedBy(totalShares).toDecimalPlaces(2, Decimal.ROUND_FLOOR);
      calculatedSum = calculatedSum.plus(share);
      return { user_id: s.user_id, amount: share };
    });
    
    let remainderCents = Math.round(totalAmount.minus(calculatedSum).times(100).toNumber());
    
    sharesData = calculatedShares.map(s => {
      let shareAmount = s.amount;
      if (remainderCents > 0) {
        shareAmount = shareAmount.plus(new Decimal(0.01));
        remainderCents -= 1;
      }
      return { user_id: s.user_id, amount_owed: shareAmount.toNumber() };
    });
  } else {
    res.status(400).json({ error: 'Invalid split type' });
    return;
  }
  
  const expense = await prisma.$transaction(async (tx) => {
    await tx.expenseShare.deleteMany({ where: { expense_id: expenseId } });
    const updatedExpense = await tx.expense.update({
      where: { id: expenseId },
      data: {
        paid_by: paid_by || existingExpense.paid_by,
        amount: totalAmount.toNumber(),
        description,
        category: category || null,
        split_type,
        shares: {
          create: sharesData
        }
      }
    });
    return updatedExpense;
  });
  
  res.json(expense);
}));

router.delete('/:expenseId', asyncHandler(async (req: any, res) => {
  const { id: group_id, expenseId } = req.params;
  
  const expense = await prisma.expense.findUnique({ where: { id: expenseId } });
  if (!expense || expense.group_id !== group_id || expense.deleted_at !== null) {
    res.status(404).json({ error: 'Expense not found' });
    return;
  }
  
  if (expense.created_by !== req.userId && expense.paid_by !== req.userId) {
    res.status(403).json({ error: 'Not authorized to delete this expense' });
    return;
  }
  
  const groupMember = await prisma.groupMember.findUnique({
    where: { group_id_user_id: { group_id, user_id: req.userId } }
  });
  if (!groupMember || groupMember.role === 'VIEWER') {
    res.status(403).json({ error: 'Viewers cannot delete expenses' });
    return;
  }
  
  await prisma.expense.update({
    where: { id: expenseId },
    data: { deleted_at: new Date() }
  });
  
  res.json({ success: true });
}));

export default router;
// trigger ide update
