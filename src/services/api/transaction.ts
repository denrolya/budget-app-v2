import moment from 'moment/moment';
import * as z from 'zod';

import { formSchema } from '@/components/features/transactions/Form';
import Transaction, { Type as TransactionType } from '@/models/Transaction';
import { api } from '@/services/api';

const formatData = (values: z.infer<typeof formSchema>, existingData?: Transaction) => ({
  account: values.account,
  amount: values.amount.toString(),
  category: values.category,
  executedAt: moment(values.executedAt).toISOString(),
  isDraft: values.isDraft ?? false,
  note: values.note || '',
  type: values.type,
  compensations: values.compensations?.map((comp, index) => {
    const existingComp = existingData?.compensations?.[index];

    return {
      id: existingComp ? `api/transactions/${existingComp.id}` : undefined,
      account: comp.account,
      amount: comp.amount.toString(),
      category: 137,
      executedAt: moment(comp.executedAt).toISOString(),
      isDraft: false,
      note: `[Compensation]: ${values.note || existingData?.id}`,
      type: TransactionType.Income,
    };
  }),
});

export const createTransaction = (data: z.infer<typeof formSchema>) => api.post(`/api/transactions/${data.type}`, formatData(data));

export const updateTransaction = (id: string | number, updatedData: z.infer<typeof formSchema>, initialData: Transaction) => api.put(`/api/transactions/${id}`, formatData(updatedData, initialData));

export const deleteTransaction = (id: string | number) => api.delete(`/api/transactions/${id}`);
