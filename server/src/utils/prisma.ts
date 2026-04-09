import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

if (!process.env.DATABASE_URL) {
  console.warn('DATABASE_URL not found in environment, checking parent directory...');
  dotenv.config({ path: path.join(__dirname, '../../../.env') });
}

console.log('Using DATABASE_URL:', process.env.DATABASE_URL);

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
} as any);

export default prisma;
