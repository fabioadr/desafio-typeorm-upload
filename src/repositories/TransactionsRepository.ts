import { EntityRepository, Repository } from 'typeorm';

import Transaction from '../models/Transaction';

interface Balance {
  income: number;
  outcome: number;
  total: number;
}

@EntityRepository(Transaction)
class TransactionsRepository extends Repository<Transaction> {
  public async getBalance(): Promise<Balance> {
    const balance: Balance = { income: 0, outcome: 0, total: 0 };

    const transactions = await this.find();

    const { income, outcome } = transactions.reduce<Balance>(
      (balanceAcc: Balance, transaction) => {
        balanceAcc[transaction.type] += transaction.value;

        return balanceAcc;
      },
      balance,
    );

    const total = income - outcome;

    return { income, outcome, total };
  }
}

export default TransactionsRepository;
