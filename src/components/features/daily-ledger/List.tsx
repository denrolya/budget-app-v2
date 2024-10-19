import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import TransactionListItem from '@/components/features/transactions/ListItemV3';
import TransferListItem from '@/components/features/transfers/ListItem';
import { Transaction } from '@/models/Transaction';
import { Transfer } from '@/models/Transfer';

type GroupedItems = {
  [date: string]: (Transaction | Transfer)[]
}

type Props = {
  groupedItems: GroupedItems
}

export const List: React.FC<Props> = ({ groupedItems }) => {
  const sortedDates = Object.keys(groupedItems).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  return (
    <div className="space-y-6">
      {sortedDates.map((date) => {
        const items = groupedItems[date].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        const transactions = items.filter((item): item is Transaction => item instanceof Transaction);
        const transfers = items.filter((item): item is Transfer => item instanceof Transfer);

        const transactionTotal = transactions.reduce((sum, t) => sum + t.amount, 0);
        const transferTotal = transfers.reduce((sum, t) => sum + t.amount, 0);

        return (
          <Card key={date} className="w-full">
            <CardHeader className="flex flex-col space-y-2 pb-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
              <CardTitle className="text-sm font-medium">
                {formatDate(date)}
              </CardTitle>
              <div className="flex flex-col space-y-1 text-sm text-muted-foreground sm:flex-row sm:space-x-4 sm:space-y-0">
                <span>Transactions: {transactions.length} ({formatCurrency(transactionTotal)})</span>
                <span>Transfers: {transfers.length} ({formatCurrency(transferTotal)})</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {items.map((item, index) => (
                <div key={index} className="flex flex-col space-y-2 sm:flex-row sm:space-x-4 sm:space-y-0">
                  <div className="w-full sm:w-1/2">
                    {item instanceof Transaction && <TransactionListItem transaction={item} />}
                  </div>
                  <div className="w-full sm:w-1/2">
                    {item instanceof Transfer && <TransferListItem transfer={item} />}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export default List;
