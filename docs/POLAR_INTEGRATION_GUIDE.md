# Polar.sh Integration - Testing & Deployment Guide

## ✅ What Was Added (Additive Changes Only)

### 1. **New API Routes**
- `POST /api/polar/create-checkout` - Creates Polar checkout session
- `POST /api/polar/webhook` - Handles payment success webhooks
- `GET /api/polar/success` - Redirects after successful payment

### 2. **New Frontend Component**
- `src/components/PolarDeposit.js` - Card payment UI

### 3. **Schema Updates (Non-Breaking)**
- Added optional `polarCustomerId` field to User model

### 4. **Environment Variables Required**
```bash
POLAR_ACCESS_TOKEN=polar_at_xxxxxxxxxxxxxxx
POLAR_ORGANIZATION_ID=org_xxxxxxxxxxxxxxx
POLAR_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxx
POLAR_PRICE_ID_50=price_xxxxxxxxxxxxxxx  # Optional
POLAR_PRICE_ID_100=price_xxxxxxxxxxxxxxx
POLAR_PRICE_ID_200=price_xxxxxxxxxxxxxxx # Optional

# Frontend (NEXT_PUBLIC_ prefix)
NEXT_PUBLIC_POLAR_PRICE_ID_50=price_xxxxxxxxxxxxxxx
NEXT_PUBLIC_POLAR_PRICE_ID_100=price_xxxxxxxxxxxxxxx
NEXT_PUBLIC_POLAR_PRICE_ID_200=price_xxxxxxxxxxxxxxx
NEXT_PUBLIC_BASE_URL=http://localhost:3000  # Change to production URL in prod
```

---

## 🧪 Local Testing

### Step 1: Set Up Polar Account
1. Go to [Polar.sh](https://polar.sh) and create an account
2. Connect your Stripe account (Test Mode)
3. Create Products:
   - Product: "EthioxHub Deposit - $50"
   - Product: "EthioxHub Deposit - $100"
   - Product: "EthioxHub Deposit - $200"
4. Copy the `price_id` for each product

### Step 2: Configure Webhooks
1. In Polar dashboard → Settings → Webhooks
2. Add endpoint: `https://your-domain.com/api/polar/webhook`
   - For local testing, use **ngrok** or **Stripe CLI**
3. Listen for event: `order.created`
4. Copy the **Webhook Secret**

### Step 3: Add Environment Variables
Create `.env.local`:
```bash
# Polar.sh
POLAR_ACCESS_TOKEN=polar_at_test_xxxxx  # From Polar dashboard
POLAR_ORGANIZATION_ID=org_xxxxx
POLAR_WEBHOOK_SECRET=whsec_xxxxx
POLAR_PRICE_ID_100=price_xxxxx

# Frontend
NEXT_PUBLIC_POLAR_PRICE_ID_100=price_xxxxx
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### Step 4: Test Locally

**Option A: Using ngrok (Recommended)**
```bash
# Terminal 1: Run development server
npm run dev

# Terminal 2: Expose localhost
ngrok http 3000

# Copy the ngrok URL (e.g., https://abc123.ngrok.io)
# Update Polar webhook URL to https://abc123.ngrok.io/api/polar/webhook
#Update NEXT_PUBLIC_BASE_URL=https://abc123.ngrok.io
```

**Test Flow:**
1. Go to `/deposit`
2. Click a Polar deposit amount ($50, $100, $200)
3. Complete Stripe test checkout:
   - Card: `4242 4242 4242 4242`
   - Expiry: Any future date
   - CVC: Any 3 digits
4. After payment → Webhook fires → Balance updated
5. Check `/my-deposits` to see the transaction

### Step 5: Verify Webhook
**Check webhook received:**
```bash
# See webhook logs in Polar dashboard
# OR check your API logs for "✅ Polar webhook received"
```

**Verify Transaction Created:**
```javascript
// In MongoDB
db.transactions.find({ 
  "metadata.source": "polar",
  type: "deposit"
}).sort({ createdAt: -1 }).limit(1)
```

**Verify Balance Updated:**
```javascript
db.users.findOne({ _id: ObjectId("YOUR_USER_ID") })
// Check balance field increased
```

---

## 🔒 Security Checklist

✅ Webhook signature verification implemented  
✅ Idempotency via `Transaction.idempotencyKey`  
✅ Atomic MongoDB transactions  
✅ No balance changes on success URL  
✅ Authentication required for checkout creation  
✅ Environment variables for all secrets  
✅ No secrets exposed to frontend

---

## 🚀 Production Deployment

### 1. Vercel Environment Variables
Add in Vercel dashboard → Settings → Environment Variables:
```
POLAR_ACCESS_TOKEN = polar_at_live_xxxxx
POLAR_ORGANIZATION_ID = org_xxxxx
POLAR_WEBHOOK_SECRET = whsec_xxxxx
POLAR_PRICE_ID_50 = price_xxxxx
POLAR_PRICE_ID_100 = price_xxxxx
POLAR_PRICE_ID_200 = price_xxxxx

NEXT_PUBLIC_POLAR_PRICE_ID_50 = price_xxxxx
NEXT_PUBLIC_POLAR_PRICE_ID_100 = price_xxxxx
NEXT_PUBLIC_POLAR_PRICE_ID_200 = price_xxxxx
NEXT_PUBLIC_BASE_URL = https://ethioxhub.vercel.app
```

### 2. Switch to Live Mode
- In Polar: Toggle from "Test Mode" to "Live Mode"
- Update all environment variables to live keys
- Update webhook URL to production domain

### 3. Deploy
```bash
git add .
git commit -m "Add Polar.sh international payment integration"
git push
```

### 4. Verify Production Webhook
- Polar Dashboard → Webhooks → Check "Recent Deliveries"
- Should see 200 OK responses

---

## 🐛 Troubleshooting

### Webhook Not Firing
1. Check webhook URL in Polar dashboard
2. Verify endpoint is publicly accessible
3. Check Polar webhook logs for delivery status
4. Ensure `order.created` event is selected

### Balance Not Updating
1. Check webhook signature validation passed
2. Verify user ID in `customer_metadata`
3. Check MongoDB transaction logs
4. Ensure `idempotencyKey` is not duplicated

### "Missing user ID in webhook"
- Ensure `customer_metadata.ethioxhub_user_id` is set in checkout creation

### Double Crediting
- **This is prevented by:**
  - `idempotencyKey` unique constraint
  - MongoDB atomic transactions
  - Check for existing transaction before processing

---

## 📊 Monitoring

**Check Successful Deposits:**
```javascript
db.transactions.find({
  type: "deposit",
  status: "approved",
  "metadata.source": "polar"
}).count()
```

**Failed Webhooks:**
```javascript
// Check Polar dashboard webhook logs
// Or add custom logging in webhook handler
```

**User Balance Reconciliation:**
```javascript
// Sum all approved deposits vs user balance
db.transactions.aggregate([
  { $match: { userId: ObjectId("USER_ID"), status: "approved" }},
  { $group: { _id: null, total: { $sum: "$amount" }}}
])
```

---

## 🔄 Rollback Plan

If issues arise, Polar can be disabled instantly:

1. **Remove Frontend Component:**
   - Comment out `<PolarDeposit />` in `/deposit/page.js`

2. **Disable Webhook:**
   - Pause webhook in Polar dashboard
   OR
   - Add early return in webhook handler:
   ```javascript
   // At top of webhook handler
   return NextResponse.json({ disabled: true });
   ```

3. **Existing Features:**
   - Bank deposit flow continues working unchanged
   - No data loss or corruption

---

## ✅ Success Indicators

- ✅ User can select Polar deposit amount
- ✅ Redirected to Stripe checkout
- ✅ Payment completes successfully
- ✅ Webhook received and signature verified
- ✅ Transaction created in database
- ✅ User balance updated atomically
- ✅ In-app notification sent
- ✅ User can spend funds on videos/photos
- ✅ **Existing bank deposit flow still works**
- ✅ **Admin approval system unchanged**

---

## 📞 Support

- Polar Docs: https://docs.polar.sh
- Stripe Test Cards: https://stripe.com/docs/testing
- MongoDB Transactions: https://www.mongodb.com/docs/manual/core/transactions/
