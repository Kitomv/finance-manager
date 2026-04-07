# tRPC API Documentation

Dokumentasi lengkap untuk tRPC routers yang tersedia di Finance Manager.

## Overview

API Finance Manager dibangun dengan tRPC, yang menyediakan type-safe RPC dengan automatic type inference dari backend ke frontend.

## Authentication

Semua endpoint (kecuali `auth.me` dan `auth.logout`) memerlukan user authentication. Authentication dilakukan melalui Manus OAuth atau custom login system.

```typescript
// Cek user authentication
const { user } = trpc.auth.me.useQuery();

// Logout
const logout = trpc.auth.logout.useMutation();
```

## Transactions API

### List Transactions
```typescript
const { data: transactions, isLoading } = trpc.transactions.list.useQuery();

// Response type:
// Array<{
//   id: string;
//   userId: number;
//   type: 'income' | 'expense';
//   amount: number;
//   category: string;
//   description: string;
//   date: string; // YYYY-MM-DD
//   createdAt: Date;
//   updatedAt: Date;
// }>
```

### Create Transaction
```typescript
const create = trpc.transactions.create.useMutation();

await create.mutateAsync({
  type: 'income',
  amount: 1000000,
  category: 'Gaji',
  description: 'Gaji bulanan',
  date: '2026-04-07',
});
```

### Update Transaction
```typescript
const update = trpc.transactions.update.useMutation();

await update.mutateAsync({
  id: 'transaction-id',
  amount: 1200000,
  description: 'Gaji bulanan (updated)',
});
```

### Delete Transaction
```typescript
const delete_ = trpc.transactions.delete.useMutation();

await delete_.mutateAsync({ id: 'transaction-id' });
```

## Installments API

### List Installments
```typescript
const { data: installments } = trpc.installments.list.useQuery();

// Response type:
// Array<{
//   id: string;
//   userId: number;
//   name: string;
//   totalAmount: number;
//   monthlyAmount: number;
//   startYear: number;
//   startMonth: number;
//   durationMonths: number;
//   createdAt: Date;
//   updatedAt: Date;
// }>
```

### Create Installment
```typescript
const create = trpc.installments.create.useMutation();

await create.mutateAsync({
  name: 'Cicilan Motor',
  totalAmount: 12000000,
  monthlyAmount: 1000000,
  startYear: 2026,
  startMonth: 4,
  durationMonths: 12,
});
```

### Delete Installment
```typescript
const delete_ = trpc.installments.delete.useMutation();

await delete_.mutateAsync({ id: 'installment-id' });
```

### List Installment Payments
```typescript
const { data: payments } = trpc.installments.payments.list.useQuery({
  installmentId: 'installment-id',
});

// Response type:
// Array<{
//   id: string;
//   installmentId: string;
//   month: number;
//   year: number;
//   amount: number;
//   isPaid: number; // 0 = false, 1 = true
//   paidDate: Date | null;
// }>
```

### Toggle Payment Status
```typescript
const toggle = trpc.installments.payments.toggle.useMutation();

// Mark as paid
await toggle.mutateAsync({
  paymentId: 'payment-id',
  isPaid: 1,
});

// Mark as unpaid
await toggle.mutateAsync({
  paymentId: 'payment-id',
  isPaid: 0,
});
```

## Savings API

### List Savings
```typescript
const { data: savings } = trpc.savings.list.useQuery();

// Response type:
// Array<{
//   id: string;
//   userId: number;
//   name: string;
//   category: string;
//   targetAmount: number;
//   currentAmount: number;
//   createdAt: Date;
//   updatedAt: Date;
// }>
```

### Create Saving
```typescript
const create = trpc.savings.create.useMutation();

await create.mutateAsync({
  name: 'Liburan ke Bali',
  category: 'liburan',
  targetAmount: 10000000,
  currentAmount: 0,
});
```

### Update Saving
```typescript
const update = trpc.savings.update.useMutation();

await update.mutateAsync({
  id: 'saving-id',
  currentAmount: 5000000,
});
```

### Delete Saving
```typescript
const delete_ = trpc.savings.delete.useMutation();

await delete_.mutateAsync({ id: 'saving-id' });
```

## Budgets API

### List Budgets
```typescript
const { data: budgets } = trpc.budgets.list.useQuery({
  month: 4,
  year: 2026,
});

// Response type:
// Array<{
//   id: string;
//   userId: number;
//   category: string;
//   limit: number;
//   month: number;
//   year: number;
//   createdAt: Date;
//   updatedAt: Date;
// }>
```

### Create Budget
```typescript
const create = trpc.budgets.create.useMutation();

await create.mutateAsync({
  category: 'Makanan',
  limit: 5000000,
  month: 4,
  year: 2026,
});
```

### Update Budget
```typescript
const update = trpc.budgets.update.useMutation();

await update.mutateAsync({
  id: 'budget-id',
  limit: 6000000,
});
```

### Delete Budget
```typescript
const delete_ = trpc.budgets.delete.useMutation();

await delete_.mutateAsync({ id: 'budget-id' });
```

## Activity Logs API

### List Activity Logs
```typescript
const { data: logs } = trpc.activityLogs.list.useQuery();

// Response type:
// Array<{
//   id: string;
//   userId: number;
//   type: 'transaction' | 'installment' | 'saving';
//   action: 'create' | 'update' | 'delete';
//   description: string;
//   createdAt: Date;
// }>
```

## Error Handling

### Common Errors

```typescript
// Unauthorized (401)
// User tidak authenticated
// Solution: Login terlebih dahulu

// Forbidden (403)
// User tidak memiliki permission
// Solution: Cek user role dan permissions

// Validation Error (400)
// Input data tidak valid
// Solution: Cek input format dan constraints
```

### Error Handling Example

```typescript
const create = trpc.transactions.create.useMutation({
  onError: (error) => {
    if (error.code === 'UNAUTHORIZED') {
      // Redirect ke login
      window.location.href = '/login';
    } else if (error.code === 'BAD_REQUEST') {
      // Tampilkan validation error
      console.error('Validation error:', error.message);
    }
  },
});
```

## Frontend Integration

### Using Hooks

```typescript
import { trpc } from '@/lib/trpc';

function MyComponent() {
  // Query
  const { data, isLoading, error } = trpc.transactions.list.useQuery();

  // Mutation
  const create = trpc.transactions.create.useMutation({
    onSuccess: () => {
      // Invalidate cache untuk refresh data
      trpc.useUtils().transactions.list.invalidate();
    },
  });

  return (
    <div>
      {isLoading && <p>Loading...</p>}
      {error && <p>Error: {error.message}</p>}
      {data && (
        <ul>
          {data.map((t) => (
            <li key={t.id}>{t.description}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

### Optimistic Updates

```typescript
const create = trpc.transactions.create.useMutation({
  onMutate: async (newTransaction) => {
    // Cancel outgoing refetches
    await trpc.useUtils().transactions.list.cancel();

    // Snapshot previous data
    const previousData = trpc.useUtils().transactions.list.getData();

    // Optimistically update cache
    trpc.useUtils().transactions.list.setData(undefined, (old) => [
      { ...newTransaction, id: 'temp-id', createdAt: new Date() },
      ...(old ?? []),
    ]);

    return { previousData };
  },
  onError: (err, newData, context) => {
    // Rollback on error
    if (context?.previousData) {
      trpc.useUtils().transactions.list.setData(undefined, context.previousData);
    }
  },
});
```

## Rate Limiting

Tidak ada rate limiting pada development. Production deployment mungkin memiliki rate limits.

## Pagination

Untuk dataset besar, gunakan pagination:

```typescript
// Contoh untuk future implementation
const { data: transactions } = trpc.transactions.list.useQuery({
  page: 1,
  limit: 20,
});
```

## Caching

React Query otomatis cache data dengan default settings:
- Cache time: 5 minutes
- Stale time: 0 seconds (data selalu dianggap stale)
- Retry: 3 times

Untuk custom cache behavior:

```typescript
const { data } = trpc.transactions.list.useQuery(undefined, {
  staleTime: 1000 * 60 * 5, // 5 minutes
  cacheTime: 1000 * 60 * 10, // 10 minutes
});
```

## WebSocket Support

Untuk real-time updates, implementasi WebSocket dapat ditambahkan di masa depan.

## Version History

- **v1.0.0** (2026-04-07): Initial release dengan transactions, installments, savings, budgets
