import { Transfer } from '@/models/transfer';
import { Details as TransactionDetails } from '@/components/features/transactions/Details';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface TransferDetailsProps {
  transfer: Transfer;
}

export const Details: React.FC<TransferDetailsProps> = ({ transfer }) => (
  <div className="space-y-4">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-1/3">Field</TableHead>
          <TableHead>Value</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Object.entries(transfer).map(([key, value]) => {
          if (key !== 'fromTransaction' && key !== 'toTransaction') {
            return (
              <TableRow key={key}>
                <TableCell className="font-medium">{key}</TableCell>
                <TableCell>{typeof value === 'number' ? (value as number).toFixed(2) : (value as string)}</TableCell>
              </TableRow>
            );
          }
          return null;
        })}
      </TableBody>
    </Table>
    <div>
      <h3 className="font-semibold mb-2">Related Transactions:</h3>
      <div className="space-y-2">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">View From Transaction</Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>From Transaction Details</DialogTitle>
            </DialogHeader>
            <TransactionDetails transaction={transfer.fromExpense} />
          </DialogContent>
        </Dialog>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">View To Transaction</Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>To Transaction Details</DialogTitle>
            </DialogHeader>
            <TransactionDetails transaction={transfer.toIncome} />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  </div>
);
