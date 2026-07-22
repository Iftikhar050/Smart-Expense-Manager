import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import groupRoutes from './routes/groups';
import expenseRoutes from './routes/expenses';
import userRoutes from './routes/users';
import adminRoutes from './routes/admin';
import rateLimit from 'express-rate-limit';

dotenv.config();

const app = express();

if (!process.env.JWT_SECRET) {
  console.error('FATAL ERROR: JWT_SECRET is not defined in environment variables.');
  process.exit(1);
}

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: 'Too many requests from this IP, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);
app.use(cors());
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/groups', groupRoutes);
app.use('/groups/:id/expenses', expenseRoutes);
app.use('/users', userRoutes);
app.use('/admin', adminRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
