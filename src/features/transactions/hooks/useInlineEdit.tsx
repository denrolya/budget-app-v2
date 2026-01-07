import moment, { Moment } from 'moment';
import { useCallback, useMemo, useState } from 'react';

import Transaction from '@/features/transactions/models/Transaction';

export type TransactionEditableField = 'account' | 'amount' | 'category' | 'note' | 'executedAt';

type EditingCell = { transactionId: number; field: TransactionEditableField } | null;

export type InlineEditConfig = {
  isUpdating: boolean;
  onSave: (args: { original: Transaction; updates: Partial<Transaction> }) => Promise<void>;
};

export const useInlineEdit = ({ isUpdating, onSave }: InlineEditConfig) => {
  const [editingCell, setEditingCell] = useState<EditingCell>(null);
  const [editValue, setEditValue] = useState<
    | string
    | number
    | Moment
    | { id: number }
    | null
  >(null);

  const startEdit = useCallback(
    (transaction: Transaction, field: TransactionEditableField) => {
      setEditingCell({ transactionId: transaction.id, field });

      switch (field) {
        case 'amount':
          setEditValue(transaction.amount);
          break;
        case 'executedAt':
          setEditValue(transaction.executedAt);
          break;
        case 'account':
          setEditValue(transaction.account);
          break;
        case 'category':
          setEditValue(transaction.category);
          break;
        case 'note':
        default:
          setEditValue(transaction.note ?? '');
      }
    },
    [],
  );

  const cancelEdit = useCallback(() => {
    setEditingCell(null);
    setEditValue(null);
  }, []);

  const isEditing = useCallback(
    (transactionId: number, field: TransactionEditableField) =>
      editingCell?.transactionId === transactionId && editingCell?.field === field,
    [editingCell],
  );

  const buildUpdates = useCallback(
    (original: Transaction): Partial<Transaction> | null => {
      if (!editingCell || editingCell.transactionId !== original.id) return null;

      const field = editingCell.field;
      switch (field) {
        case 'account':
          return { account: (editValue as any) ?? original.account };
        case 'category':
          return { category: (editValue as any) ?? original.category };
        case 'amount': {
          const n = typeof editValue === 'number' ? editValue : Number(editValue);
          if (!Number.isFinite(n)) return null;
          return { amount: n };
        }
        case 'executedAt': {
          const m = moment.isMoment(editValue) ? editValue : moment(String(editValue));
          if (!m.isValid()) return null;
          return { executedAt: m };
        }
        case 'note':
        default:
          return { note: String(editValue ?? '') };
      }
    },
    [editValue, editingCell],
  );

  const save = useCallback(
    async (original: Transaction) => {
      if (isUpdating) return;

      const updates = buildUpdates(original);
      if (!updates) return;

      await onSave({ original, updates });
      cancelEdit();
    },
    [buildUpdates, cancelEdit, isUpdating, onSave],
  );

  const keyHandler = useMemo(() => ({
      onKeyDown: (e: React.KeyboardEvent, tx: Transaction) => {
        if (e.key === 'Escape') cancelEdit();
        // pick ONE behavior and standardize; I recommend Ctrl/⌘+Enter to save
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) void save(tx);
      },
    }), [cancelEdit, save]);

  return {
    editingCell,
    editValue,
    setEditValue,
    startEdit,
    cancelEdit,
    save,
    isEditing,
    keyHandler,
  };
};
