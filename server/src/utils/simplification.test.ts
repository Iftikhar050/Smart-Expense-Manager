import { Decimal } from 'decimal.js';
import { simplifyDebts } from './simplification';

describe('Debt Simplification Algorithm', () => {
  it('handles simple 2-person case', () => {
    // A paid $100 for A and B. A is owed 50, B owes 50.
    const balances = {
      'A': new Decimal(50),
      'B': new Decimal(-50)
    };
    
    const transactions = simplifyDebts(balances);
    expect(transactions).toHaveLength(1);
    expect(transactions[0].from).toBe('B');
    expect(transactions[0].to).toBe('A');
    expect(transactions[0].amount.toNumber()).toBe(50);
  });

  it('handles 3-person cycle (A owes B, B owes C, C owes A)', () => {
    // A owes B $50. B owes C $50. C owes A $50.
    // Net balances for everyone should be 0.
    const balances = {
      'A': new Decimal(0),
      'B': new Decimal(0),
      'C': new Decimal(0)
    };
    
    const transactions = simplifyDebts(balances);
    expect(transactions).toHaveLength(0); // Already settled
  });

  it('handles an already settled group', () => {
    const balances = {
      'A': new Decimal(0.001),
      'B': new Decimal(-0.001),
    };
    
    const transactions = simplifyDebts(balances);
    expect(transactions).toHaveLength(0);
  });

  it('handles a group where one person paid for everyone', () => {
    // A paid $300 for A, B, C, D (equal split 75 each)
    // A is owed 225. B, C, D owe 75 each.
    const balances = {
      'A': new Decimal(225),
      'B': new Decimal(-75),
      'C': new Decimal(-75),
      'D': new Decimal(-75),
    };
    
    const transactions = simplifyDebts(balances);
    expect(transactions).toHaveLength(3);
    
    // Sort transactions by 'from' to make assertions easy
    transactions.sort((a, b) => a.from.localeCompare(b.from));
    
    expect(transactions[0].from).toBe('B');
    expect(transactions[0].to).toBe('A');
    expect(transactions[0].amount.toNumber()).toBe(75);

    expect(transactions[1].from).toBe('C');
    expect(transactions[1].to).toBe('A');
    expect(transactions[1].amount.toNumber()).toBe(75);

    expect(transactions[2].from).toBe('D');
    expect(transactions[2].to).toBe('A');
    expect(transactions[2].amount.toNumber()).toBe(75);
  });
  
  it('minimizes transactions', () => {
    // Complex scenario:
    // A is owed 100
    // B is owed 50
    // C owes 80
    // D owes 70
    const balances = {
      'A': new Decimal(100),
      'B': new Decimal(50),
      'C': new Decimal(-80),
      'D': new Decimal(-70),
    };
    
    const transactions = simplifyDebts(balances);
    // C owes 80 -> A (min(80, 100) = 80). A left with 20.
    // D owes 70 -> A (min(70, 20) = 20). A left with 0. D left with 50.
    // D owes 50 -> B (min(50, 50) = 50). D left with 0. B left with 0.
    
    expect(transactions).toHaveLength(3);
    
    expect(transactions[0].from).toBe('C');
    expect(transactions[0].to).toBe('A');
    expect(transactions[0].amount.toNumber()).toBe(80);

    expect(transactions[1].from).toBe('D');
    expect(transactions[1].to).toBe('A');
    expect(transactions[1].amount.toNumber()).toBe(20);

    expect(transactions[2].from).toBe('D');
    expect(transactions[2].to).toBe('B');
    expect(transactions[2].amount.toNumber()).toBe(50);
  });
});
