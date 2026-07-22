import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import { prisma } from '../db';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'secret';

router.post('/register', asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    res.status(400).json({ error: 'Missing fields' });
    return;
  }
  
  const existingUser = await prisma.user.findUnique({ where: { email } });
  let user;
  
  if (existingUser) {
    if (existingUser.is_dummy) {
      const password_hash = await bcrypt.hash(password, 10);
      user = await prisma.user.update({
        where: { id: existingUser.id },
        data: { name, password_hash, is_dummy: false }
      });
    } else {
      res.status(400).json({ error: 'Email already exists' });
      return;
    }
  } else {
    const password_hash = await bcrypt.hash(password, 10);
    user = await prisma.user.create({
      data: { name, email, password_hash, is_dummy: false }
    });
  }
  
  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
}));

router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: 'Missing fields' });
    return;
  }
  
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.is_dummy || !user.password_hash || !(await bcrypt.compare(password, user.password_hash))) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }
  
  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
}));

export default router;
