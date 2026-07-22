import { Decimal } from 'decimal.js';

export type Expense = { paid_by: string; amount: number | string | Decimal };
export type ExpenseShare = { user_id: string; amount_owed: number | string | Decimal };
export type Settlement = { from_user: string; to_user: string; amount: number | string | Decimal };

export function calculateNetBalances(
  userIds: string[],
  expenses: Expense[],
  shares: ExpenseShare[],
  settlements: Settlement[]
): Record<string, Decimal> {
  const balances: Record<string, Decimal> = {};
  
  for (const userId of userIds) {
    balances[userId] = new Decimal(0);
  }
  
  // + total amount they paid
  for (const exp of expenses) {
    if (balances[exp.paid_by] !== undefined) {
      balances[exp.paid_by] = balances[exp.paid_by].plus(new Decimal(exp.amount));
    }
  }
  
  // - total amount they owe
  for (const share of shares) {
    if (balances[share.user_id] !== undefined) {
      balances[share.user_id] = balances[share.user_id].minus(new Decimal(share.amount_owed));
    }
  }
  
  // + settlements sent (reduces debt / increases balance)
  // - settlements received (reduces credit / decreases balance)
  for (const st of settlements) {
    if (balances[st.from_user] !== undefined) {
      balances[st.from_user] = balances[st.from_user].plus(new Decimal(st.amount));
    }
    if (balances[st.to_user] !== undefined) {
      balances[st.to_user] = balances[st.to_user].minus(new Decimal(st.amount));
    }
  }
  
  return balances;
}
