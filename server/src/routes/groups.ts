import { Router } from 'express';
import bcrypt from 'bcrypt';
import asyncHandler from 'express-async-handler';
import { prisma } from '../db';
import { requireAuth } from '../middleware/auth';
import { calculateNetBalances } from '../utils/balances';
import { simplifyDebts } from '../utils/simplification';

const router = Router();
router.use(requireAuth);
// Force nodemon restart again

router.post('/', asyncHandler(async (req: any, res) => {
  const { name, members, budget } = req.body;
  if (!name) {
    res.status(400).json({ error: 'Group name is required' });
    return;
  }
  
  const groupName = name.trim();
  if (groupName.length < 2 || groupName.length > 50) {
    res.status(400).json({ error: 'Group name must be between 2 and 50 characters' });
    return;
  }
  
  const parsedBudget = budget ? parseFloat(budget) : 0;
  
  const result = await prisma.$transaction(async (tx) => {
    const group = await tx.group.create({
      data: {
        name: groupName,
        created_by: req.userId,
        budget: parsedBudget
      }
    });
    
    await tx.groupMember.create({
      data: { group_id: group.id, user_id: req.userId, role: 'ADMIN' }
    });
    
    const generatedCredentials: any[] = [];
    
    if (members && Array.isArray(members)) {
      for (const m of members) {
        if (!m.name) continue;
        
        let targetUserId;
        let generatedEmail = m.email;
        let generatedPassword = null;
        const role = m.role || 'VIEWER';
        
        if (m.email) {
          let user = await tx.user.findUnique({ where: { email: m.email } });
          if (!user) {
            generatedPassword = Math.random().toString(36).slice(-8);
            const password_hash = await bcrypt.hash(generatedPassword, 10);
            user = await tx.user.create({
              data: { name: m.name, email: m.email, is_dummy: false, password_hash }
            });
            generatedCredentials.push({ name: m.name, email: m.email, password: generatedPassword });
          }
          targetUserId = user.id;
        } else {
          generatedEmail = `${m.name.toLowerCase().replace(/\s+/g, '.')}.${Math.floor(Math.random() * 10000)}@fairshare.local`;
          generatedPassword = Math.random().toString(36).slice(-8);
          const password_hash = await bcrypt.hash(generatedPassword, 10);
          const user = await tx.user.create({
            data: { name: m.name, email: generatedEmail, is_dummy: false, password_hash }
          });
          targetUserId = user.id;
          generatedCredentials.push({ name: m.name, email: generatedEmail, password: generatedPassword });
        }
        
        if (targetUserId !== req.userId) {
          await tx.groupMember.upsert({
            where: { group_id_user_id: { group_id: group.id, user_id: targetUserId } },
            create: { group_id: group.id, user_id: targetUserId, role },
            update: { role }
          });
        }
      }
    }
    
    return { group, generatedCredentials };
  });
  
  res.json({ ...result.group, generatedCredentials: result.generatedCredentials });
}));

router.get('/', asyncHandler(async (req: any, res) => {
  const groups = await prisma.group.findMany({
    where: {
      members: {
        some: { user_id: req.userId }
      }
    },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, email: true } } }
      }
    }
  });
  res.json(groups);
}));

router.get('/:id', asyncHandler(async (req: any, res) => {
  const { id } = req.params;
  const group = await prisma.group.findUnique({
    where: { id },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, email: true } } }
      }
    }
  });
  
  if (!group) {
    res.status(404).json({ error: 'Group not found' });
    return;
  }
  
  const isMember = group.members.some(m => m.user_id === req.userId);
  if (!isMember) {
    res.status(403).json({ error: 'Not a member of this group' });
    return;
  }
  
  res.json(group);
}));

router.post('/:id/members', asyncHandler(async (req: any, res) => {
  const { id } = req.params;
  const { name, email, role = 'VIEWER' } = req.body;
  
  if (!name && !email) {
    res.status(400).json({ error: 'Name or email is required' });
    return;
  }
  
  if (name) {
    const memberName = name.trim();
    if (memberName.length < 2 || memberName.length > 50) {
      res.status(400).json({ error: 'Name must be between 2 and 50 characters' });
      return;
    }
  }
  
  const group = await prisma.group.findUnique({
    where: { id },
    include: { members: true }
  });
  
  if (!group) {
    res.status(404).json({ error: 'Group not found' });
    return;
  }
  
  const isMember = group.members.some(m => m.user_id === req.userId);
  if (!isMember) {
    res.status(403).json({ error: 'Not a member of this group' });
    return;
  }
  
  let targetUserId;
  let generatedEmail = email;
  let generatedPassword = null;
  let generatedCredential = null;
  
  if (email) {
    let userToAdd = await prisma.user.findUnique({ where: { email } });
    if (!userToAdd) {
      if (!name) {
         res.status(404).json({ error: 'User with this email not found, please provide a name to create them.' });
         return;
      }
      generatedPassword = Math.random().toString(36).slice(-8);
      const password_hash = await bcrypt.hash(generatedPassword, 10);
      userToAdd = await prisma.user.create({
        data: { name, email, is_dummy: false, password_hash }
      });
      generatedCredential = { name, email, password: generatedPassword };
    }
    targetUserId = userToAdd.id;
  } else {
    if (!name) {
      res.status(400).json({ error: 'Name is required if email is not provided' });
      return;
    }
    generatedEmail = `${name.toLowerCase().replace(/\s+/g, '.')}.${Math.floor(Math.random() * 10000)}@fairshare.local`;
    generatedPassword = Math.random().toString(36).slice(-8);
    const password_hash = await bcrypt.hash(generatedPassword, 10);
    const userToAdd = await prisma.user.create({
      data: { name, email: generatedEmail, is_dummy: false, password_hash }
    });
    targetUserId = userToAdd.id;
    generatedCredential = { name, email: generatedEmail, password: generatedPassword };
  }
  
  const isAlreadyMember = group.members.some(m => m.user_id === targetUserId);
  if (isAlreadyMember) {
    res.status(400).json({ error: 'User is already a member' });
    return;
  }
  
  const newMember = await prisma.groupMember.create({
    data: {
      group_id: id,
      user_id: targetUserId,
      role
    },
    include: {
      user: { select: { id: true, name: true, email: true } }
    }
  });
  
  res.json({ member: newMember, generatedCredential });
}));

router.get('/:id/balances', asyncHandler(async (req: any, res) => {
  const { id: group_id } = req.params;
  
  const group = await prisma.group.findUnique({
    where: { id: group_id },
    include: { members: true, expenses: { include: { shares: true } }, settlements: true }
  });
  
  if (!group) {
    res.status(404).json({ error: 'Group not found' });
    return;
  }
  
  const userIds = group.members.map(m => m.user_id);
  const shares = group.expenses.flatMap(e => e.shares);
  
  const balances = calculateNetBalances(userIds, group.expenses, shares, group.settlements);
  
  const formattedBalances = Object.fromEntries(
    Object.entries(balances).map(([userId, balance]) => [userId, balance.toNumber()])
  );
  
  res.json(formattedBalances);
}));

router.get('/:id/simplified-debts', asyncHandler(async (req: any, res) => {
  const { id: group_id } = req.params;
  
  const group = await prisma.group.findUnique({
    where: { id: group_id },
    include: { members: true, expenses: { include: { shares: true } }, settlements: true }
  });
  
  if (!group) {
    res.status(404).json({ error: 'Group not found' });
    return;
  }
  
  const userIds = group.members.map(m => m.user_id);
  const shares = group.expenses.flatMap(e => e.shares);
  
  const balances = calculateNetBalances(userIds, group.expenses, shares, group.settlements);
  const simplifiedDebts = simplifyDebts(balances);
  
  res.json(simplifiedDebts.map(d => ({ ...d, amount: d.amount.toNumber() })));
}));

router.post('/:id/settlements', asyncHandler(async (req: any, res) => {
  const { id: group_id } = req.params;
  const { to_user_id, from_user_id, amount } = req.body;
  
  const fromUser = from_user_id || req.userId;
  
  if (!to_user_id || !amount) {
    res.status(400).json({ error: 'to_user_id and amount are required' });
    return;
  }
  
  const group = await prisma.group.findUnique({
    where: { id: group_id },
    include: { members: true }
  });
  
  if (!group) {
    res.status(404).json({ error: 'Group not found' });
    return;
  }
  
  const isMember = group.members.some(m => m.user_id === fromUser);
  const isToMember = group.members.some(m => m.user_id === to_user_id);
  
  if (!isMember || !isToMember) {
    res.status(403).json({ error: 'Both users must be members of the group' });
    return;
  }
  
  const currentUserMember = group.members.find(m => m.user_id === req.userId);
  if (!currentUserMember || currentUserMember.role === 'VIEWER') {
    res.status(403).json({ error: 'Viewers cannot create settlements' });
    return;
  }
  
  const settlement = await prisma.settlement.create({
    data: {
      group_id,
      from_user: fromUser,
      to_user: to_user_id,
      amount: parseFloat(amount)
    }
  });
  
  res.json(settlement);
}));

router.get('/:id/settlements', asyncHandler(async (req: any, res) => {
  const { id: group_id } = req.params;
  
  const settlements = await prisma.settlement.findMany({
    where: { group_id, deleted_at: null },
    include: {
      sender: { select: { id: true, name: true } },
      receiver: { select: { id: true, name: true } }
    },
    orderBy: { settled_at: 'desc' }
  });
  
  res.json(settlements);
}));

router.delete('/:id/settlements/:settlementId', asyncHandler(async (req: any, res) => {
  const { id: group_id, settlementId } = req.params;
  
  const settlement = await prisma.settlement.findUnique({ where: { id: settlementId } });
  if (!settlement || settlement.group_id !== group_id || settlement.deleted_at !== null) {
    res.status(404).json({ error: 'Settlement not found' });
    return;
  }
  
  if (settlement.from_user !== req.userId && settlement.to_user !== req.userId) {
    res.status(403).json({ error: 'Not authorized to delete this settlement' });
    return;
  }
  
  const groupMember = await prisma.groupMember.findUnique({
    where: { group_id_user_id: { group_id, user_id: req.userId } }
  });
  if (!groupMember || groupMember.role === 'VIEWER') {
    res.status(403).json({ error: 'Viewers cannot delete settlements' });
    return;
  }
  
  await prisma.settlement.update({
    where: { id: settlementId },
    data: { deleted_at: new Date() }
  });
  
  res.json({ success: true });
}));

router.delete('/:id/members/:userId', asyncHandler(async (req: any, res) => {
  const { id: group_id, userId } = req.params;
  
  const group = await prisma.group.findUnique({
    where: { id: group_id },
    include: { members: true, expenses: { where: { deleted_at: null }, include: { shares: true } }, settlements: { where: { deleted_at: null } } }
  });
  
  if (!group) {
    res.status(404).json({ error: 'Group not found' });
    return;
  }
  
  const isMember = group.members.some(m => m.user_id === req.userId);
  if (!isMember) {
    res.status(403).json({ error: 'Not a member of this group' });
    return;
  }
  
  const targetMember = group.members.find(m => m.user_id === userId);
  if (!targetMember) {
    res.status(404).json({ error: 'User is not a member of this group' });
    return;
  }
  
  const userIds = group.members.map(m => m.user_id);
  const shares = group.expenses.flatMap(e => e.shares);
  const balances = calculateNetBalances(userIds, group.expenses, shares, group.settlements);
  
  const targetBalance = balances[userId]?.toNumber() || 0;
  // Use a small epsilon to avoid floating point issues
  if (Math.abs(targetBalance) > 0.01) {
    res.status(400).json({ error: 'Cannot remove member with non-zero balance' });
    return;
  }
  
  await prisma.groupMember.delete({
    where: { group_id_user_id: { group_id, user_id: userId } }
  });
  
  res.json({ success: true });
}));

router.put('/:id/members/:userId/role', asyncHandler(async (req: any, res) => {
  const { id: group_id, userId } = req.params;
  const { role } = req.body;
  
  if (!['ADMIN', 'EDITOR', 'VIEWER'].includes(role)) {
    res.status(400).json({ error: 'Invalid role' });
    return;
  }
  
  const group = await prisma.group.findUnique({
    where: { id: group_id },
    include: { members: true }
  });
  
  if (!group) {
    res.status(404).json({ error: 'Group not found' });
    return;
  }
  
  const currentUserMember = group.members.find(m => m.user_id === req.userId);
  if (!currentUserMember || currentUserMember.role !== 'ADMIN') {
    res.status(403).json({ error: 'Only admins can change roles' });
    return;
  }
  
  const targetMember = group.members.find(m => m.user_id === userId);
  if (!targetMember) {
    res.status(404).json({ error: 'User is not a member of this group' });
    return;
  }
  
  // Prevent changing the creator's role
  if (group.created_by === userId && role !== 'ADMIN') {
    res.status(400).json({ error: 'Cannot change the role of the group creator' });
    return;
  }
  
  const updatedMember = await prisma.groupMember.update({
    where: { group_id_user_id: { group_id, user_id: userId } },
    data: { role },
    include: { user: { select: { id: true, name: true, email: true } } }
  });
  
  res.json(updatedMember);
}));

router.delete('/:id', asyncHandler(async (req: any, res) => {
  const { id } = req.params;
  
  // Verify user is an ADMIN of the group
  const member = await prisma.groupMember.findUnique({
    where: { group_id_user_id: { group_id: id, user_id: req.userId } }
  });
  
  if (!member || (member.role !== 'ADMIN' && member.role !== 'EDITOR')) {
    res.status(403).json({ error: 'Only group admins and editors can delete the group' });
    return;
  }
  
  // Execute a transaction to delete all child rows before the group
  await prisma.$transaction(async (tx) => {
    // Delete expense shares
    await tx.expenseShare.deleteMany({
      where: { expense: { group_id: id } }
    });
    
    // Delete expenses
    await tx.expense.deleteMany({
      where: { group_id: id }
    });
    
    // Delete settlements
    await tx.settlement.deleteMany({
      where: { group_id: id }
    });
    
    // Delete group members
    await tx.groupMember.deleteMany({
      where: { group_id: id }
    });
    
    // Finally delete the group
    await tx.group.delete({
      where: { id }
    });
  });
  
  res.json({ success: true, message: 'Group deleted successfully' });
}));

export default router;
