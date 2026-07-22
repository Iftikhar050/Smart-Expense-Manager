import { prisma } from './src/db';

async function main() {
  console.log('Deleting all data...');
  
  await prisma.settlement.deleteMany({});
  await prisma.expenseShare.deleteMany({});
  await prisma.expense.deleteMany({});
  await prisma.groupMember.deleteMany({});
  await prisma.group.deleteMany({});
  await prisma.user.deleteMany({});
  
  console.log('All data deleted successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    // DO NOT disconnect pg pool otherwise it might crash the connection
    process.exit(0);
  });
