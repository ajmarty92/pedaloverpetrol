# QA Scenarios

Manual and automated test scenarios for the PedalOverPetrol courier system.
Run `make seed` in `backend/` first to populate test data.

## Seed Credentials

| Role | Email | Password | Login endpoint |
|------|-------|----------|---------------|
| Admin | `admin@pedaloverpetrol.com` | `admin123` | `POST /api/auth/login` |
| Dispatcher | `dispatch@pedaloverpetrol.com` | `dispatch123` | `POST /api/auth/login` |
| Driver | `driver.james@pedaloverpetrol.com` | `driver123` | `POST /api/auth/login` |
| Driver | `driver.aisha@pedaloverpetrol.com` | `driver123` | `POST /api/auth/login` |
| Driver | `driver.tom@pedaloverpetrol.com` | `driver123` | `POST /api/auth/login` |
| Customer | `portal@brickcoffee.co.uk` | `customer123` | `POST /api/customer/auth/login` |

---

## Scenario 1: Full Job Lifecycle (Dispatcher → Driver → POD)

**Goal:** Verify a job can be created, assigned, and completed with proof of delivery.

### Steps

1. **Login as dispatcher**
   - Web: go to `http://localhost:3000/login`, enter `dispatch@pedaloverpetrol.com` / `dispatch123`
   - Verify: redirected to `/admin` dashboard

2. **Create a new job**
   - Navigate to `/admin/jobs`
   - Use Swagger UI or API: `POST /api/jobs` with:
     ```json
     {
       "customer_id": "<any customer id from seed>",
       "pickup_address": "15 Clerkenwell Rd, London EC1M 5RD",
       "dropoff_address": "42 Shoreditch High St, London E1 6JE",
       "price": 18.50,
       "notes": "QA test job"
     }
     ```
   - Verify: job appears with status `pending`, tracking ID generated

3. **Assign to driver**
   - `POST /api/jobs/{job_id}/assign` with `{"driver_id": "<james driver id>"}`
   - Verify: status changes to `assigned`, driver_id populated

4. **Driver picks up**
   - Mobile app: login as `driver.james@pedaloverpetrol.com`
   - Find the new job in "My Jobs" list
   - Tap job → tap "Mark Picked Up" → confirm
   - Verify: status changes to `picked_up`

5. **Driver marks in transit**
   - Tap "Mark In Transit" → confirm
   - Verify: status changes to `in_transit`

6. **Driver delivers with POD**
   - Tap "Mark Delivered" → navigates to POD screen
   - Enter recipient name: "Sarah Mitchell"
   - Take 1-2 photos (or skip in simulator)
   - Tap "Submit POD & Mark Delivered"
   - Verify: job status → `delivered`, POD record created

7. **Verify POD from admin**
   - Back on web admin `/admin/jobs` — job shows `delivered` status
   - Via API: `GET /api/jobs/{job_id}` — has `pod` relationship data

### Expected results
- Job walked through: `pending` → `assigned` → `picked_up` → `in_transit` → `delivered`
- POD has recipient name, photo URLs, timestamp
- Invalid transitions (e.g., `pending` → `delivered`) return `409 Conflict`

---

## Scenario 2: Customer Tracking Link

**Goal:** Verify public tracking shows live status updates.

### Steps

1. **Get a tracking ID**
   - From `/admin/jobs`, note the `tracking_id` of any job (e.g., `A3K9F2XB7Q1P`)

2. **Open public tracking page**
   - Browser: `http://localhost:3000/tracking/A3K9F2XB7Q1P`
   - Verify: page loads with status, addresses, step indicator

3. **Check different statuses**
   - Open tracking for a `pending` job → step indicator at step 1
   - Open tracking for a `delivered` job → all 5 steps completed, green checkmarks
   - Open tracking for a `failed` job → shows "Failed" badge, no step progression
   - Open tracking for an `assigned` job → driver name and section visible

4. **Test invalid tracking ID**
   - `http://localhost:3000/tracking/DOESNOTEXIST`
   - Verify: shows "Tracking not found" error

### Expected results
- Tracking page is public (no login required)
- Sensitive fields (customer_id, price, notes) are NOT displayed
- Driver name and location shown when assigned

---

## Scenario 3: Route Optimization

**Goal:** Verify route optimization suggests an efficient stop order.

### Steps

1. **Login as admin** on the web dashboard

2. **Navigate to `/admin/jobs`**

3. **Select a driver** from the "Select driver…" dropdown
   - Pick a driver who has 3+ assigned jobs (seed data creates these)

4. **Click "Optimize Route"**
   - Modal opens → click "Run Optimization"
   - Verify: shows numbered job list with tracking IDs
   - Verify: total distance (km) and estimated travel time displayed
   - Verify: engine says "haversine_nearest_neighbor"

5. **Click "Apply Route"**
   - Verify: success confirmation
   - Verify: jobs table now shows sequence numbers in the "Seq" column

6. **Verify via API**
   - `GET /api/jobs?status=assigned` — jobs should have `route_sequence` values

### Expected results
- 1–25 jobs can be optimized in one request
- Empty job set returns 422
- Applied sequence persists on job records

---

## Scenario 4: Customer Portal

**Goal:** Verify customers can log in and view their jobs, PODs, and invoices.

### Steps

1. **Login as customer**
   - Go to `http://localhost:3000/customer/login`
   - Enter `portal@brickcoffee.co.uk` / `customer123`
   - Verify: redirected to `/customer/jobs`

2. **View job list**
   - Verify: only shows jobs for "Brick & Mortar Coffee" (not other customers)
   - Verify: columns show tracking ID, addresses, status, payment status, date

3. **View POD**
   - Find a delivered job
   - Click "POD" button
   - Verify: modal shows recipient name, signature URL, photo URLs, delivery timestamp

4. **View invoice**
   - Click "Invoice" button on any job
   - Verify: modal shows tracking ID, customer name, addresses, price, dates

5. **Pay for a job**
   - Find an unpaid job with a price
   - Click "Pay Now" button
   - Verify: in stub mode, immediately shows "Paid" badge (no Stripe UI)
   - Verify: refreshing the page still shows "Paid"

6. **Test isolation**
   - Via API with the customer token: `GET /api/customer/jobs`
   - Verify: returns only this customer's jobs
   - Try accessing another customer's job ID → 404

7. **Test auth boundary**
   - Use the customer token to call `GET /api/jobs` (admin endpoint) → 403
   - Use an admin token to call `GET /api/customer/jobs` → 403

### Expected results
- Customer sees only their own data
- Admin tokens are rejected on customer endpoints and vice versa
- Payment stub works end-to-end without Stripe configuration

---

## Scenario 5: Analytics Dashboard

**Goal:** Verify analytics endpoint data matches the seeded jobs.

### Steps

1. **Login as admin**, navigate to `/admin` (dashboard)

2. **Check stat cards** (30-day range):
   - Total Jobs: should be ~25 (from seed)
   - Delivered: should be ~8
   - Failed: should be ~2
   - On-Time Rate: should be ~80%

3. **Check bar chart**:
   - Should show bars for days that have seeded jobs
   - Orange = delivered, red = failed

4. **Check driver table**:
   - Should show 3 drivers with completion/failure counts
   - On-time rates should be colored (green ≥ 90%, amber ≥ 70%, red < 70%)

5. **Change range to 7 days**:
   - Counts may decrease (seed data spans ~14 days)
   - Chart should show only 7 bars

### Expected results
- All three data sections load independently
- Changing range re-fetches all data
- Empty ranges show zeros, not errors

---

## Scenario 6: Pricing Engine

**Goal:** Verify pricing rules can be managed and prices quoted.

### Steps

1. **Navigate to `/admin/settings/pricing`**

2. **View existing rule**
   - "Standard" rule should appear (from seed): $5.00 base, $1.50/mile

3. **Calculate a price**
   - In the Price Calculator: distance = 10 miles, Rush = checked
   - Click "Calculate"
   - Verify: total = (5.00 + 15.00 + 3.00) = $23.00

4. **Create a new rule**
   - Click "New Rule"
   - Name: "Express", base: $10, per-mile: $2.50, rush: $5, heavy: $8
   - Zone config: `{"zones": {"central": 1.0, "outer": 2.0}}`
   - Save

5. **Edit a rule**
   - Click edit on "Standard", change per_mile_rate to $2.00
   - Save and verify the change persists

### Expected results
- CRUD operations work for pricing rules
- Price calculator uses the active rule
- Zone multipliers are applied correctly

---

## Automated E2E Tests

Scaffolded in `e2e/` using Playwright. To run:

```bash
cd e2e
npm install
npx playwright test
```

Currently covers:
- Admin login flow (login page → dashboard redirect)
- Jobs list page loads after authentication

See `e2e/tests/admin.spec.ts` for details.
