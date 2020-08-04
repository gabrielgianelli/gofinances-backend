import { getCustomRepository, getRepository } from 'typeorm';
import AppError from '../errors/AppError';

import Transaction from '../models/Transaction';
import TransactionsRepository from '../repositories/TransactionsRepository';
import Category from '../models/Category';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  categoryTitle: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    categoryTitle,
  }: Request): Promise<Transaction> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const categoriesRepository = getRepository(Category);

    if (!['income', 'outcome'].includes(type)) {
      throw new AppError('Transaction type is invalid');
    }

    const { total: totalBalance } = await transactionsRepository.getBalance();

    if (type === 'outcome' && value > totalBalance) {
      throw new AppError('You do not have enough balance');
    }

    const existingCategory = await categoriesRepository.findOne({
      where: { title: categoryTitle },
    });

    const category = !existingCategory
      ? categoriesRepository.create({ title: categoryTitle })
      : existingCategory;

    await categoriesRepository.save(category);

    const transaction = transactionsRepository.create({
      title,
      value,
      type,
      category_id: category.id,
      category,
    });

    await transactionsRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
