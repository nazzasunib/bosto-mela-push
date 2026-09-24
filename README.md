# Bosto Mela PoS

Point of Sale system for the Bosto Mela clothing shop — Next.js 16, React 19, TypeScript, Tailwind CSS 4, shadcn/ui, Supabase (PostgreSQL), Recharts, Framer Motion.

## Setup (one time)

1. **Install Node.js 20+** from https://nodejs.org.
2. **Create a Supabase project** at https://supabase.com (free plan is fine).
3. In Supabase open **SQL Editor → New query**, paste the whole of `supabase/schema.sql` and click **Run**. This creates all tables, functions, the image bucket and a default admin user.
4. Copy `.env.example` to `.env.local` and fill in:
   - `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` — Supabase → Project Settings → API.
   - `SESSION_SECRET` — any long random text (32+ characters).
5. In this folder run:

```bash
npm install
npm run dev
```

Open http://localhost:3000 and log in as **Admin** with PIN **1234**. Change the PIN in **Settings** straight away and add your cashiers.

For daily shop use run the faster production build: `npm run build` then `npm start`.

## Using the POS

- **New Sale**: scan a barcode or type a code and press **Enter**. `BSS*3` adds 3 at once. Several entries can go on one line: `BSS*3 RBS*2`.
- If one code matches several sizes/colours, a picker appears.
- The cart is saved in the browser, so a page refresh never loses it.
- Shortcuts: `Ctrl/⌘+K` search · `Ctrl/⌘+Enter` complete sale · `F2` new sale · `F4` amount paid · `Esc` close.

## Product code → cost price

`B=1 R=2 I=3 G=4 H=5 T=6 D=7 A=8 Y=9 S=0` — e.g. `BSS`=৳100, `RBS`=৳210, `HTS`=৳560, `YAB`=৳981. The parser lives in `src/lib/code-parser.ts`. Cost can be overridden per product.

## Money rules

- Revenue = price × qty − discounts; Gross profit = revenue − cost.
- Daily net profit = gross profit − expenses − return adjustments (profit lost on returned items).
- Returns refund the proportional paid amount, put stock back, and mark the sale `partially_returned` / `returned`. Sales are never deleted — admins can **cancel** a sale (stock restored, status `cancelled`).
- Every stock change (stock in, sale, return, adjustment) is written to `stock_movements` with user and reference.
- Sale, return and stock changes run inside single PostgreSQL functions, so they either fully succeed or change nothing. A repeated checkout submit (e.g. network retry) cannot create a duplicate sale.

## Security

- The Supabase service-role key is used **only on the server** (server actions). The browser never talks to Supabase directly; Row Level Security blocks the public anon key.
- Users log in with a PIN (hashed with bcrypt inside Postgres); sessions are signed HTTP-only cookies. 5 wrong PINs lock the user for 2 minutes.

## Scripts

`npm run dev` · `npm run build` · `npm start` · `npm run lint` · `npm run typecheck` · `npm test` (code parser, quantity parser, sale/profit/return maths)

## Folder structure

```
supabase/schema.sql         database tables, functions, RLS, default admin
src/app/(pos)/...           pages: dashboard, sale, products, stock, returns, sales, expenses, reports (+ closing), settings
src/app/invoice/[id]        printable invoice (80mm receipt or A4)
src/components/ui           shadcn/ui components
src/components/...          Sidebar, Topbar, StatCard, SalesChart, ProductSearch, POSCart, PaymentModal, ProductForm, DataTable, Invoice, ExpenseForm, ReturnModal …
src/lib/actions             server actions (all writes)
src/lib/queries             server data loading
src/lib/code-parser.ts      product-code & quantity parser
src/lib/calc.ts             cart / profit / refund maths
```
