"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const client_1 = require("@prisma/client");
const pg_1 = require("pg");
const adapter_pg_1 = require("@prisma/adapter-pg");
const connectionString = `${process.env.DATABASE_URL}`;
const pool = new pg_1.Pool({ connectionString });
const adapter = new adapter_pg_1.PrismaPg(pool);
const prisma = new client_1.PrismaClient({ adapter });
prisma.$queryRaw `SELECT 1`.then(() => {
    console.log('Successfully connected to the database!');
    process.exit(0);
}).catch(e => {
    console.error('Failed to connect', e);
    process.exit(1);
});
