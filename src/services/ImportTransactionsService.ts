import { getRepository } from 'typeorm';
import { parse } from 'fast-csv';
import fs from 'fs';

import CreateTransactionService from './CreateTransactionService';
import Category from '../models/Category';
import Transaction from '../models/Transaction';

class ImportTransactionsService {
  public async execute(filePath: string): Promise<Transaction[]> {
    const categoriesRepository = getRepository(Category);
    const createTransactionService = new CreateTransactionService();
    const transactions: Transaction[] = [];
    const parsedTransactions: any[] = [];
    const parsedCategories: any[] = [];

    await new Promise(resolve => {
      fs.createReadStream(filePath)
        .pipe(parse({ headers: true, ltrim: true, rtrim: true }))
        .on('data', row => {
          parsedTransactions.push(row);
          parsedCategories.push(row.category);
        })
        .on('end', (rowCount: number) => {
          console.log(`Parsed ${rowCount} rows`);
          resolve();
        });
    }).catch(error => console.error(error));

    const existentCategories = await categoriesRepository.find();
    const existentCategoriesTitles = existentCategories.map(
      ({ title }) => title,
    );

    const addCategoriesTitles = parsedCategories
      .filter(category => !existentCategoriesTitles.includes(category))
      .filter((value, index, self) => self.indexOf(value) === index);

    const newCategories = categoriesRepository.create(
      addCategoriesTitles.map(title => ({ title })),
    );

    await categoriesRepository.save(newCategories);

    const promises = parsedTransactions.map(async (parsedTransaction, idx) => {
      const { title, value, type, category } = parsedTransaction;

      const transaction = await createTransactionService.execute(
        { title, value, type, category },
        false,
      );

      transactions.push(transaction);
    });

    await Promise.all(promises);

    return transactions;
  }
}

export default ImportTransactionsService;
