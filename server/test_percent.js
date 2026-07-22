const { Decimal } = require('decimal.js');

const parseVal = (v) => {
  if (v == null) return 0;
  const num = Number(v);
  return isNaN(num) ? 0 : num;
};

const splits = [
  { user_id: '1', value: 50 },
  { user_id: '2', value: 50 }
];

const totalAmount = new Decimal('100');

const sum = splits.reduce((acc, s) => acc.plus(new Decimal(parseVal(s.value))), new Decimal(0));
if (!sum.equals(new Decimal(100))) {
  console.log('Percentages must sum to 100');
  process.exit(1);
}

let calculatedSum = new Decimal(0);
const calculatedShares = splits.map((s) => {
  const share = totalAmount.times(new Decimal(parseVal(s.value))).dividedBy(100).toDecimalPlaces(2, Decimal.ROUND_FLOOR);
  calculatedSum = calculatedSum.plus(share);
  return { user_id: s.user_id, amount: share };
});

let remainderCents = Math.round(totalAmount.minus(calculatedSum).times(100).toNumber());

const sharesData = calculatedShares.map(s => {
  let shareAmount = s.amount;
  if (remainderCents > 0) {
    shareAmount = shareAmount.plus(new Decimal(0.01));
    remainderCents -= 1;
  }
  return { user_id: s.user_id, amount_owed: shareAmount.toNumber() };
});

console.log('Success:', sharesData);
