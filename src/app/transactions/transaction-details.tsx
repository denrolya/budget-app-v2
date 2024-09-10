import React from 'react';

import { Transaction } from '@/models/transaction.ts';
import { TransactionListItem } from '@/app/transactions/transaction-list-item';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface TransactionDetailsProps {
  transaction: Transaction;
}

export const TransactionDetails: React.FC<TransactionDetailsProps> = ({ transaction }) => {
  const compensatedTransaction = false; // TODO: Compensation transaction's details should show original expense transaction and I dont want to have cyclic dependencies

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-1/3">Field</TableHead>
            <TableHead>Value</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Object.entries(transaction).map(([key, value]) => (
            <TableRow key={key}>
              <TableCell className="font-medium">{key}</TableCell>
              <TableCell>{typeof value === 'object' ? JSON.stringify(value) : value}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {transaction.compensations && transaction.compensations?.length > 0 && (
        <div>
          <h3 className="font-semibold mb-2">Compensation Transactions:</h3>
          <div className="space-y-2">
            {transaction?.compensations?.map(comp => (
              comp &&
              <TransactionListItem key={comp.id} transaction={comp} isCompensationView />
            ))}
          </div>
        </div>
      )}
      {compensatedTransaction && (
        <div>
          <h3 className="font-semibold mb-2">Compensated Transaction:</h3>
          <TransactionListItem transaction={compensatedTransaction} isCompensationView />
        </div>
      )}
    </div>
  );
};
