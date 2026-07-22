import { Decimal } from 'decimal.js';
import { calculateNetBalances, Expense, ExpenseShare, Settlement } from './balances';

describe('Balance Calculation', () => {
  it('calculates correct net balances with expenses and settlements', () => {
    const userIds = ['A', 'B', 'C'];
    
    // A paid $90. Share: A=30, B=30, C=30.
    const expenses: Expense[] = [
      { paid_by: 'A', amount: 90 }
    ];
    
    const shares: ExpenseShare[] = [
      { user_id: 'A', amount_owed: 30 },
      { user_id: 'B', amount_owed: 30 },
      { user_id: 'C', amount_owed: 30 },
    ];
    
    // B sends a settlement of $10 to A
    const settlements: Settlement[] = [
      { from_user: 'B', to_user: 'A', amount: 10 }
    ];
    
    const balances = calculateNetBalances(userIds, expenses, shares, settlements);
    
    // A: +90 (paid) - 30 (owed) - 10 (settlement received) = 50
    expect(balances['A'].toNumber()).toBe(50);
    // B: 0 (paid) - 30 (owed) + 10 (settlement sent) = -20
    expect(balances['B'].toNumber()).toBe(-20);
    // C: 0 (paid) - 30 (owed) + 0 = -30
    expect(balances['C'].toNumber()).toBe(-30);
  });
});
