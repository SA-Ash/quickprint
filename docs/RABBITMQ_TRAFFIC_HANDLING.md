# RabbitMQ Traffic Handling - QuickPrint

## Overview

RabbitMQ is used in QuickPrint to handle background tasks asynchronously. This means the backend API remains fast and responsive while heavy operations (SMS, email, file processing) happen in the background.

---

## Architecture

```
┌──────────────┐       ┌─────────────┐       ┌────────────────┐
│   Backend    │──────▶│  RabbitMQ   │──────▶│  Async Worker  │
│   (API)      │ push  │   (Queue)   │ pull  │  (Consumer)    │
└──────────────┘       └─────────────┘       └────────────────┘
     │                       │                      │
     │ Returns               │ Holds messages       │ Processes
     │ immediately           │ until consumed       │ in background
     ▼                       ▼                      ▼
   User                  Persistent              SMS/Email
   Response              Storage                 Sent
```

---

## How It Works

### 1. Backend Publishes Message

When an event occurs (order created, payment success), the backend publishes a message:

```typescript
// backend/src/modules/order/order.service.ts
await rabbitmq.publish('order-events', {
  type: 'ORDER_CREATED',
  payload: {
    orderId: order.id,
    userId: user.id,
    orderNumber: order.orderNumber
  }
});
```

**Key Point**: Backend doesn't wait. Returns response to user immediately.

### 2. RabbitMQ Queues the Message

- Message stored in queue
- Survives server restarts (persistent)
- Multiple messages can queue up
- No message is ever lost

### 3. Async Worker Consumes

```typescript
// async-worker/src/consumers/notification.consumer.ts
rabbitmq.subscribe('order-events', async (message) => {
  switch (message.type) {
    case 'ORDER_CREATED':
      await sendSMS(message.payload.userId, 'Order placed!');
      await sendEmail(message.payload.userId, 'Order confirmation');
      break;
  }
});
```

---

## Traffic Handling Scenarios

### Normal Load (100 orders/hour)

```
Messages: ●───●───●───●───●
Worker:   ✓   ✓   ✓   ✓   ✓
Queue:    [empty - processing instantly]
```

### High Load (1,000 orders/hour)

```
Messages: ●●●●●●●●●●●●●●●●●●●●
Worker:   ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓...
Queue:    [●●●●●●●●] ← Messages wait, none lost
```

### Worker Crash

```
Messages: ●●●●●●●●●●
Worker:   ✗ (crashed)
Queue:    [●●●●●●●●●●] ← Messages safe, waiting
Worker:   ✓ (restarted) → Catches up
```

---

## Scaling Workers

Add more workers to process faster:

```bash
# Single worker (default)
docker-compose up async-worker

# Scale to 3 workers
docker-compose up --scale async-worker=3
```

With 3 workers:
```
Queue:    [●●●●●●●●●]
Worker 1: ✓ ✓ ✓
Worker 2: ✓ ✓ ✓
Worker 3: ✓ ✓ ✓
          └── 3x faster processing
```

---

## Queue Types in QuickPrint

| Queue Name | Purpose | Priority |
|------------|---------|----------|
| `order-events` | Order status updates | High |
| `notifications` | SMS/Email sending | Medium |
| `file-processing` | PDF generation, file conversion | Low |
| `analytics` | Usage tracking, reports | Low |

---

## Message Flow Example

### Order Placed → SMS Sent

```
1. User places order
   └─▶ POST /api/orders
   
2. Backend creates order in database
   └─▶ order.service.ts → prisma.order.create()

3. Backend publishes event (non-blocking)
   └─▶ rabbitmq.publish('notifications', {...})
   
4. Backend returns response (user sees success)
   └─▶ { success: true, orderId: 'xxx' }

5. [Background] RabbitMQ holds message
   └─▶ Queue: notifications [●]

6. [Background] Async worker picks up
   └─▶ notification.consumer.ts

7. [Background] SMS sent
   └─▶ Twilio API called

8. [Background] Message acknowledged, removed from queue
```

**Total time for user**: ~200ms  
**SMS sent**: ~2-5 seconds later (background)

---

## Error Handling

### Retry Logic

```typescript
// Message fails → RabbitMQ requeues
rabbitmq.subscribe('notifications', async (message) => {
  try {
    await sendSMS(message.userId, message.text);
    return { ack: true }; // Success, remove from queue
  } catch (error) {
    if (message.retryCount < 3) {
      return { requeue: true }; // Try again
    } else {
      await saveToDeadLetterQueue(message); // Give up, log for review
      return { ack: true };
    }
  }
});
```

### Dead Letter Queue

Failed messages after 3 retries go to dead letter queue for manual review:

```
notifications → [fail 3x] → dead-letter-notifications
```

---

## Monitoring

### RabbitMQ Management UI

Access at: `http://localhost:15672`  
Default credentials: `admin` / `your-password`

### Key Metrics to Watch

| Metric | Healthy | Warning | Critical |
|--------|---------|---------|----------|
| Queue depth | < 100 | 100-1000 | > 1000 |
| Message rate | Stable | Increasing | Backlog growing |
| Consumer count | ≥ 1 | 0 | 0 for > 1 min |

---

## Configuration

### Backend (Publisher)

```typescript
// backend/src/config/rabbitmq.ts
export const rabbitmqConfig = {
  url: process.env.RABBITMQ_URL || 'amqp://localhost:5672',
  queues: {
    notifications: { durable: true },
    orderEvents: { durable: true },
    fileProcessing: { durable: true }
  }
};
```

### Async Worker (Consumer)

```typescript
// async-worker/src/config/rabbitmq.ts
export const consumerConfig = {
  prefetch: 10, // Process 10 messages at a time
  retryAttempts: 3,
  retryDelay: 5000 // 5 seconds between retries
};
```

---

## Summary

| Question | Answer |
|----------|--------|
| Is it automatic? | ✅ Yes, fully automatic |
| Do I manage queues manually? | ❌ No, RabbitMQ handles it |
| What if worker is slow? | Messages queue up, none lost |
| What if worker crashes? | Messages wait, resume when back |
| How to go faster? | Scale workers: `--scale async-worker=3` |
| Is it like Kafka? | Simpler. Kafka is for massive scale (millions/sec) |

---

## When to Worry

Only take action if:
- Queue depth > 1000 for extended period → Add workers
- Dead letter queue growing → Check error logs
- Consumer count = 0 → Restart async-worker
