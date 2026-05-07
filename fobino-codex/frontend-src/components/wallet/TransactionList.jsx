import Card from '../ui/Card';
import TransactionRow from './TransactionRow';

export default function TransactionList({
  items = [],
  loading = false,
  onSelect,
}) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((item) => (
          <Card key={item} variant="wallet" className="animate-pulse rounded-2xl" padding="lg">
            <div className="h-24 rounded-xl bg-gray-100" />
          </Card>
        ))}
      </div>
    );
  }

  if (!items.length) {
    return (
      <Card variant="wallet" className="rounded-2xl" padding="lg">
        <div className="py-10 text-center text-gray-500">
          تراکنشی با این فیلترها پیدا نشد.
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <TransactionRow
          key={item._id}
          item={item}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}