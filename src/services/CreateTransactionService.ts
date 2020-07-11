import { getCustomRepository, getRepository } from 'typeorm';

import AppError from '../errors/AppError';

import Category from '../models/Category';
import Transaction from '../models/Transaction';
import TransactionsRepository from '../repositories/TransactionsRepository';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class CreateTransactionService {
  public async execute(
    { title, value, type, category }: Request,
    checkBalance: boolean,
  ): Promise<Transaction> {
    const categoriesRepository = getRepository(Category);
    const transactionsRepository = getCustomRepository(TransactionsRepository);

    if (type === 'outcome' && checkBalance) {
      const { total } = await transactionsRepository.getBalance();

      if (total < value) {
        throw new AppError(
          'Transaction not completed due to insufficient balance.',
        );
      }
    }

    const categoryDb = await categoriesRepository.findOne({
      where: { title: category },
    });

    let categoryId;
    if (!categoryDb) {
      const newCategory = categoriesRepository.create({
        title: category,
      });

      await categoriesRepository.save(newCategory);
      categoryId = newCategory.id;
    } else {
      categoryId = categoryDb.id;
    }

    const transaction = transactionsRepository.create({
      title,
      value,
      type,
      category_id: categoryId,
    });

    await transactionsRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
