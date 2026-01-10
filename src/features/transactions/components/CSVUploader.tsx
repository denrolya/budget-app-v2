import moment from 'moment';
import Papa from 'papaparse';
import { useMemo, useState } from 'react';

import { MOMENT_DATETIME_FORM_FORMAT } from '@/constants/datetime';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MultiSelect } from '@/components/ui/multi-select';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export interface TransactionFormData {
  isDraft: boolean;
  account?: string;
  amount: number;
  type: 'Expense' | 'Income';
  category?: string;
  note?: string;
  executedAt: string;
}

export const defaultTransactionForm: TransactionFormData = {
  isDraft: false,
  account: undefined,
  amount: 0,
  type: 'Expense',
  category: undefined,
  note: undefined,
  executedAt: moment().format(MOMENT_DATETIME_FORM_FORMAT),
};

export const CSVUploader = ({ onComplete }: { onComplete?: (transactions: TransactionFormData[]) => void }) => {
  const [headers, setHeaders] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<any[]>([]);
  const [showMapper, setShowMapper] = useState(false);

  const [amountField, setAmountField] = useState<string | undefined>();
  const [noteFields, setNoteFields] = useState<string[]>([]);
  const [executedAtField, setExecutedAtField] = useState<string | undefined>();
  const [datetimeFormat, setDatetimeFormat] = useState<string>('DD-MM-YYYY HH:mm:ss');
  const [inferTypeFromAmount, setInferTypeFromAmount] = useState<boolean>(true);
  const [noteDelimiter, setNoteDelimiter] = useState<string>(' | ');
  const [timezoneOffset, setTimezoneOffset] = useState<number>(0);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsed = results.data as Record<string, string>[];
        const headerRow = results.meta.fields || [];
        setCsvRows(parsed);
        setHeaders(headerRow);
        setShowMapper(true);
      },
    });
  };

  const previewTransactions = useMemo(() => csvRows.slice(0, 3).map((row) => {
    const entry = { ...defaultTransactionForm };

    if (amountField) {
      const raw = parseFloat(row[amountField] || '0') || 0;
      entry.amount = Math.abs(raw);
      if (inferTypeFromAmount) {
        entry.type = raw < 0 ? 'Expense' : 'Income';
      }
    }

    if (executedAtField) {
      const parsed = moment(row[executedAtField], datetimeFormat).subtract(timezoneOffset, 'hours');
      entry.executedAt = parsed.format(MOMENT_DATETIME_FORM_FORMAT);
    }

    if (noteFields.length > 0) {
      entry.note = noteFields.map((f) => row[f] ?? '').join(noteDelimiter);
    }

    return entry;
  }), [csvRows, amountField, executedAtField, noteFields, datetimeFormat, timezoneOffset, noteDelimiter, inferTypeFromAmount]);

  const handleApply = () => {
    const allTransactions: TransactionFormData[] = csvRows.map((row) => {
      const entry = { ...defaultTransactionForm };

      if (amountField) {
        const raw = parseFloat(row[amountField] || '0') || 0;
        entry.amount = Math.abs(raw);
        if (inferTypeFromAmount) {
          entry.type = raw < 0 ? 'Expense' : 'Income';
        }
      }

      if (executedAtField) {
        const parsed = moment(row[executedAtField], datetimeFormat).subtract(timezoneOffset, 'hours');
        entry.executedAt = parsed.format(MOMENT_DATETIME_FORM_FORMAT);
      }

      if (noteFields.length > 0) {
        entry.note = noteFields.map((f) => row[f] ?? '').join(noteDelimiter);
      }

      return entry;
    });

    setShowMapper(false);
    onComplete?.(allTransactions);
  };

  return (
    <>
      <Input accept=".csv" type="file" onChange={handleFileChange} />
      {showMapper && (
        <Dialog open onOpenChange={setShowMapper}>
          <DialogContent className="max-w-3xl w-full overflow-auto">
            <DialogHeader>
              <DialogTitle>Map CSV Fields</DialogTitle>
              <DialogDescription>whater</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-1">
                <Label>Amount</Label>
                <Select onValueChange={(v) => setAmountField(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="-- None --" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">-- None --</SelectItem>
                    {headers.map((h) => <SelectItem value={h} key={h}>{h}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label>Note</Label>
                <MultiSelect
                  defaultValue={noteFields}
                  maxCount={4}
                  options={headers.map((h) => ({ label: h, value: h }))}
                  placeholder="Select columns for note"
                  onValueChange={setNoteFields}
                />
              </div>

              {noteFields.length > 1 && (
                <div className="space-y-1">
                  <Label>Note delimiter</Label>
                  <Input value={noteDelimiter} onChange={(e) => setNoteDelimiter(e.target.value)} />
                </div>
              )}

              <div className="space-y-1">
                <Label>Executed At</Label>
                <Select onValueChange={(v) => setExecutedAtField(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="-- None --" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">-- None --</SelectItem>
                    {headers.map((h) => <SelectItem value={h} key={h}>{h}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {executedAtField && (
                <>
                  <div className="space-y-1">
                    <Label>Datetime format</Label>
                    <Input value={datetimeFormat} onChange={(e) => setDatetimeFormat(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label>Timezone offset (in hours)</Label>
                    <Input
                      type="number"
                      value={timezoneOffset}
                      onChange={(e) => setTimezoneOffset(Number(e.target.value))} />
                  </div>
                </>
              )}

              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={inferTypeFromAmount}
                  id="inferType"
                  onCheckedChange={(val) => setInferTypeFromAmount(!!val)} />
                <Label htmlFor="inferType">Infer type from amount</Label>
              </div>

              <div className="space-y-2">
                <Label className="font-bold">Preview</Label>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Amount</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Note</TableHead>
                      <TableHead>Executed At</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewTransactions.map((tx, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{tx.amount}</TableCell>
                        <TableCell>{tx.type}</TableCell>
                        <TableCell>{tx.note}</TableCell>
                        <TableCell>{tx.executedAt}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button onClick={handleApply}>Apply</Button>
              <Button variant="ghost" onClick={() => setShowMapper(false)}>Cancel</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};
