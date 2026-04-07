import { getDb, createTransaction, createInstallment, createInstallmentPayment, createSaving, createBudget, createActivityLog, getUserByOpenId } from './db.ts';

/**
 * Data Migration Script
 * Migrasi data dari localStorage format JSON ke database MySQL
 * 
 * Usage: node migrate-data.mjs <userId> <dataFile>
 * Example: node migrate-data.mjs 1 transactions.json
 */

const args = process.argv.slice(2);
if (args.length < 2) {
  console.log('Usage: node migrate-data.mjs <userId> <dataFile>');
  console.log('Example: node migrate-data.mjs 1 transactions.json');
  process.exit(1);
}

const userId = parseInt(args[0], 10);
const dataFile = args[1];

if (isNaN(userId)) {
  console.error('Error: userId must be a number');
  process.exit(1);
}

async function migrateData() {
  try {
    const db = await getDb();
    if (!db) {
      console.error('Error: Cannot connect to database');
      process.exit(1);
    }

    // Read data file
    const fs = await import('fs');
    const path = await import('path');
    
    const filePath = path.default.resolve(dataFile);
    if (!fs.default.existsSync(filePath)) {
      console.error(`Error: File not found: ${filePath}`);
      process.exit(1);
    }

    const fileContent = fs.default.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(fileContent);

    console.log('Starting data migration...');
    console.log(`Target userId: ${userId}`);

    // Migrate transactions
    if (data.transactions && Array.isArray(data.transactions)) {
      console.log(`\nMigrating ${data.transactions.length} transactions...`);
      for (const transaction of data.transactions) {
        try {
          await createTransaction({
            id: transaction.id,
            userId,
            type: transaction.type,
            amount: transaction.amount,
            category: transaction.category,
            description: transaction.description || '',
            date: transaction.date,
          });
          console.log(`  ✓ Transaction: ${transaction.id}`);
        } catch (error) {
          console.error(`  ✗ Failed to migrate transaction ${transaction.id}:`, error.message);
        }
      }
    }

    // Migrate installments
    if (data.installments && Array.isArray(data.installments)) {
      console.log(`\nMigrating ${data.installments.length} installments...`);
      for (const installment of data.installments) {
        try {
          const durationMonths = installment.totalMonths || installment.durationMonths || 12;
          
          await createInstallment({
            id: installment.id,
            userId,
            name: installment.name,
            totalAmount: installment.totalAmount,
            monthlyAmount: installment.monthlyAmount,
            startYear: installment.startYear,
            startMonth: installment.startMonth,
            durationMonths,
          });
          console.log(`  ✓ Installment: ${installment.id}`);

          // Migrate installment payments
          if (installment.payments && Array.isArray(installment.payments)) {
            for (const payment of installment.payments) {
              try {
                await createInstallmentPayment({
                  id: payment.id,
                  installmentId: installment.id,
                  month: payment.month,
                  year: payment.year,
                  amount: payment.amount,
                  isPaid: payment.isPaid ? 1 : 0,
                  paidDate: payment.paidDate ? new Date(payment.paidDate) : null,
                });
              } catch (error) {
                console.error(`    ✗ Failed to migrate payment ${payment.id}:`, error.message);
              }
            }
          }
        } catch (error) {
          console.error(`  ✗ Failed to migrate installment ${installment.id}:`, error.message);
        }
      }
    }

    // Migrate savings
    if (data.savings && Array.isArray(data.savings)) {
      console.log(`\nMigrating ${data.savings.length} savings...`);
      for (const saving of data.savings) {
        try {
          await createSaving({
            id: saving.id,
            userId,
            name: saving.name,
            category: saving.category,
            targetAmount: saving.targetAmount,
            currentAmount: saving.currentAmount || 0,
          });
          console.log(`  ✓ Saving: ${saving.id}`);
        } catch (error) {
          console.error(`  ✗ Failed to migrate saving ${saving.id}:`, error.message);
        }
      }
    }

    // Migrate budgets
    if (data.budgets && Array.isArray(data.budgets)) {
      console.log(`\nMigrating ${data.budgets.length} budgets...`);
      for (const budget of data.budgets) {
        try {
          await createBudget({
            id: budget.id,
            userId,
            category: budget.category,
            limit: budget.limit,
            month: budget.month,
            year: budget.year,
          });
          console.log(`  ✓ Budget: ${budget.id}`);
        } catch (error) {
          console.error(`  ✗ Failed to migrate budget ${budget.id}:`, error.message);
        }
      }
    }

    console.log('\n✓ Data migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error during migration:', error);
    process.exit(1);
  }
}

migrateData();
