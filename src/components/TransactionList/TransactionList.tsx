const transactions = [
  { id: 1, description: 'Groceries', date: '2024-08-16', amount: -50.75 },
  { id: 2, description: 'Salary', date: '2024-08-15', amount: 2500 },
  { id: 3, description: 'Electricity Bill', date: '2024-08-10', amount: -120.45 },
];

const TransactionList = () => (
    <div className="bg-card-light dark:bg-card-dark shadow-card rounded-md p-6">
      <h2 className="text-lg font-semibold text-primary-light dark:text-primary-dark mb-4">
        Recent Transactions
      </h2>
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-border-light dark:border-border-dark">
            <th className="py-2 text-secondary-light dark:text-secondary-dark">Description</th>
            <th className="py-2 text-secondary-light dark:text-secondary-dark">Date</th>
            <th className="py-2 text-secondary-light dark:text-secondary-dark text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx) => (
            <tr
              key={tx.id}
              className="border-b border-border-light dark:border-border-dark last:border-0"
            >
              <td className="py-2">{tx.description}</td>
              <td className="py-2">{tx.date}</td>
              <td
                className={`py-2 text-right ${
                  tx.amount > 0 ? 'text-positive-light dark:text-positive-dark' : 'text-negative-light dark:text-negative-dark'
                }`}
              >
                {tx.amount > 0 ? `+${tx.amount.toFixed(2)}` : `${tx.amount.toFixed(2)}`}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

export default TransactionList;
