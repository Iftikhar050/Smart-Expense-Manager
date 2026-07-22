import { Decimal } from 'decimal.js';

export type SimplifiedDebt = { from: string; to: string; amount: Decimal };

export function simplifyDebts(balances: Record<string, Decimal>): SimplifiedDebt[] {
  const creditors: { user: string; amount: Decimal }[] = [];
  const debtors: { user: string; amount: Decimal }[] = [];
  
  for (const [user, balance] of Object.entries(balances)) {
    if (balance.gt(0.009)) {
      creditors.push({ user, amount: balance });
    } else if (balance.lt(-0.009)) {
      debtors.push({ user, amount: balance.abs() });
    }
  }
  
  creditors.sort((a, b) => b.amount.cmp(a.amount));
  debtors.sort((a, b) => b.amount.cmp(a.amount));
  
  const transactions: SimplifiedDebt[] = [];
  let i = 0;
  let j = 0;
  const tolerance = new Decimal(0.009);
  
  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];
    
    const amount = Decimal.min(debtor.amount, creditor.amount);
    const roundedAmount = amount.toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
    
    if (roundedAmount.gt(0)) {
      transactions.push({
        from: debtor.user,
        to: creditor.user,
        amount: roundedAmount
      });
    }
    
    debtor.amount = debtor.amount.minus(amount);
    creditor.amount = creditor.amount.minus(amount);
    
    if (debtor.amount.lte(tolerance)) {
      i++;
    }
    if (creditor.amount.lte(tolerance)) {
      j++;
    }
  }
  
  return transactions;
}
