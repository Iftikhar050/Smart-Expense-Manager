import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

prisma.$queryRaw`SELECT 1`.then(() => {
  console.log('Successfully connected to the database!');
  process.exit(0);
}).catch(e => {
  console.error('Failed to connect', e);
  process.exit(1);
});
