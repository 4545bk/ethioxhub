# Polar.sh Integration Architecture

## 🎯 System Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         ETHIOXHUB PAYMENT SYSTEM                         │
│                                                                          │
│  ┌──────────────────────────┐     ┌──────────────────────────────────┐ │
│  │   EXISTING SYSTEM        │     │   NEW: POLAR INTEGRATION         │ │
│  │   (UNTOUCHED)            │     │   (ADDITIVE ONLY)                │ │
│  └──────────────────────────┘     └──────────────────────────────────┘ │
│                                                                          │
│  Bank Deposit (Manual)             Card Payment (Automated)             │
│  ├─ User uploads screenshot        ├─ User clicks amount                │
│  ├─ Admin reviews                  ├─ Redirects to Polar checkout       │
│  ├─ Admin approves/rejects         ├─ Stripe processes payment         │
│  └─ Balance updated                ├─ Webhook → Auto-approve           │
│                                    └─ Balance updated instantly         │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │              SHARED WALLET SYSTEM (UNCHANGED)                       │ │
│  │  ┌──────────────────────────────────────────────────────────────┐  │ │
│  │  │  User.balance (cents)                                         │  │ │
│  │  │  Transaction ledger                                           │  │ │
│  │  │  Content purchase flow                                        │  │ │
│  │  └──────────────────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 📊 Polar Payment Flow

```
USER                    ETHIOXHUB            POLAR/STRIPE           WEBHOOK
  │                         │                      │                   │
  ├─[1] Visit /deposit      │                      │                   │
  │                         │                      │                   │
  ├─[2] Click "$100"────────►                      │                   │
  │                         │                      │                   │
  │                    [3] Create                  │                   │
  │                    checkout session            │                   │
  │                         ├───────────────────────►                   │
  │                         │                      │                   │
  │                         │◄───────────────────────┤                   │
  │                         │    checkout_url       │                   │
  │                         │                      │                   │
  │◄────[4] Redirect─────────┤                      │                   │
  │                         │                      │                   │
  ├─[5] Enter card details──────────────────────────►                   │
  │                         │          [Stripe]     │                   │
  │                         │                      │                   │
  │◄────[6] Success redirect──────────────────────────┤                   │
  │      (NO balance change)│                      │                   │
  │                         │                      │                   │
  │                         │                      │                   │
  │                         │                      ├─[7] Payment Success─►
  │                         │                      │                   │
  │                         │   [8] Webhook Event  │                   │
  │                         │◄───────────────────────────────────────────┤
  │                         │  (signed payload)    │                   │
  │                         │                      │                   │
  │                    [9] ATOMIC TX:              │                   │
  │                    ├─ Create Transaction       │                   │
  │                    ├─ Credit balance          │                   │
  │                    ├─ Add notification        │                   │
  │                    └─ Log to Telegram         │                   │
  │                         │                      │                   │
  │                         ├─[10] 200 OK──────────────────────────────►
  │                         │                      │                   │
  ├─[11] See balance────────►                      │                   │
  │      updated!           │                      │                   │
```

---

## 🔐 Security Layers

```
┌──────────────────────────────────────────────────────────────┐
│                    SECURITY CHECKPOINTS                       │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  [1] Checkout Creation                                       │
│      ├─ requireAuth() middleware                             │
│      ├─ Valid price ID check                                 │
│      └─ User metadata attached                               │
│                                                               │
│  [2] Webhook Processing                                      │
│      ├─ Signature verification (HMAC SHA-256)                │
│      ├─ Idempotency check (prevent double-credit)            │
│      ├─ User existence validation                            │
│      ├─ Amount validation (> 0)                              │
│      └─ MongoDB atomic transaction                           │
│                                                               │
│  [3] Database Level                                          │
│      ├─ Unique idempotencyKey constraint                     │
│      ├─ Positive balance validation                          │
│      └─ Session isolation (snapshot reads)                   │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

## 💾 Database Changes

```
BEFORE POLAR INTEGRATION:
┌─────────────┐
│ Transaction │
├─────────────┤
│ userId      │
│ amount      │
│ type        │
│ status      │
│ cloudinary  │
│ metadata    │
└─────────────┘

AFTER POLAR INTEGRATION (ADDITIVE):
┌─────────────┐
│ Transaction │
├─────────────┤
│ userId      │
│ amount      │
│ type        │ ← Still uses 'deposit'
│ status      │ ← Still uses 'approved'
│ cloudinary  │ ← Empty for Polar
│ metadata    │ ← NEW: { source: 'polar', orderId: '...' }
│ idempotency │ ← NEW: 'polar_{order_id}'
└─────────────┘

┌──────┐
│ User │
├──────┤
│ ...  │
│ polar│ ← NEW (optional): polarCustomerId
└──────┘
```

---

## 🚨 Failure Scenarios & Handling

```
SCENARIO                     WHAT HAPPENS                 SAFETY NET
────────────────────────────────────────────────────────────────────
Payment succeeds,            User doesn't get credit      Polar retry
webhook fails                                             mechanism

Webhook fires twice          Second attempt rejected      idempotencyKey
                                                          unique constraint

Malicious webhook            Rejected                     Signature
(fake payment)                                            verification

User not found               Transaction aborted          MongoDB session
in database                                               rollback

MongoDB crash during         All changes rolled back      Atomic
balance update                                            transaction

Network timeout              Webhook retried by Polar     Idempotent
                             (safe to process again)      handler
```

---

## 🔄 Coexistence with Existing System

```
                    ┌────────────────────┐
                    │   USER WALLET      │
                    │   balance: 50000   │  (500 ETB)
                    └─────────┬──────────┘
                              │
                     Funded by ▼
          ┌───────────────────┴───────────────────┐
          │                                       │
    ┌─────▼─────┐                          ┌─────▼─────┐
    │   BANK    │                          │  POLAR    │
    │  DEPOSIT  │                          │  DEPOSIT  │
    │           │                          │           │
    │ Manual    │                          │ Automated │
    │ Admin     │                          │ Webhook   │
    │ Review    │                          │ Instant   │
    └─────┬─────┘                          └─────┬─────┘
          │                                      │
          └──────────────┬───────────────────────┘
                         │
                    Balance ▼ Spent On
          ┌─────────────────────────────┐
          │  Video Unlock  │ Photo Buy  │
          │  Subscription  │ ...        │
          └───────────────────────────────┘

          ALL SPENDING LOGIC UNCHANGED ✅
```

---

## 📈 Transaction Ledger Example

```javascript
// BEFORE: Bank deposit
{
  _id: ObjectId("..."),
  userId: ObjectId("user123"),
  amount: 10000, // 100 ETB
  type: "deposit",
  status: "approved",
  cloudinaryUrl: "https://...",
  senderName: "John Doe",
  processedBy: ObjectId("admin456"),
  processedAt: ISODate("2025-01-15"),
  metadata: {
    transactionCode: "TX123",
    phone: "+251911223344"
  }
}

// AFTER: Polar deposit (coexists peacefully)
{
  _id: ObjectId("..."),
  userId: ObjectId("user123"),
  amount: 10000, // $100 USD
  type: "deposit", // SAME TYPE
  status: "approved", // SAME STATUS
  cloudinaryUrl: null, // No screenshot needed
  processedBy: null, // Automated
  processedAt: ISODate("2025-01-15"),
  idempotencyKey: "polar_ord_abc123", // NEW
  metadata: {
    source: "polar", // NEW
    orderId: "ord_abc123",
    polarCustomerEmail: "user@example.com",
    notes: "International card payment via Polar.sh"
  }
}
```

---

## ✅ Integration Verification Checklist

- [ ] Polar checkout opens successfully
- [ ] Stripe test card works
- [ ] Webhook received (check logs)
- [ ] Signature validated ✓
- [ ] Transaction created in DB
- [ ] User balance incremented
- [ ] Notification added
- [ ] Idempotency prevents duplicate
- [ ] **Bank deposit still works**
- [ ] **Admin approval unchanged**
- [ ] **Video purchase works**
- [ ] **Photo purchase works**
- [ ] **All existing features functional**
