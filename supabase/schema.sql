-- =====================================================================
-- Bosto Mela PoS — Supabase / PostgreSQL schema
-- Run this whole file once in Supabase Dashboard → SQL Editor.
-- Safe to re-run: uses IF NOT EXISTS / CREATE OR REPLACE.
-- =====================================================================

create extension if not exists pgcrypto with schema extensions;

-- ---------- USERS ----------
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text not null default 'cashier' check (role in ('admin','cashier')),
  pin_hash text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------- SETTINGS (single row) ----------
create table if not exists public.settings (
  id int primary key default 1 check (id = 1),
  shop_name text not null default 'Bosto Mela',
  address text not null default 'Dhaka, Bangladesh',
  phone text not null default '',
  invoice_footer text not null default 'Thank you for shopping with us!',
  low_stock_threshold int not null default 5 check (low_stock_threshold >= 0),
  updated_at timestamptz not null default now()
);
insert into public.settings (id) values (1) on conflict (id) do nothing;

-- ---------- PRODUCTS ----------
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null,
  category text not null default 'General',
  size text not null default '',
  color text not null default '',
  cost_price numeric(12,2) not null default 0 check (cost_price >= 0),
  selling_price numeric(12,2) not null default 0 check (selling_price >= 0),
  stock_quantity int not null default 0,
  barcode text unique,
  image_url text,
  status text not null default 'active' check (status in ('active','inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists products_code_idx on public.products (upper(code));
create index if not exists products_name_idx on public.products (lower(name));

-- ---------- SALES ----------
create table if not exists public.sales (
  id uuid primary key default gen_random_uuid(),
  invoice_no text not null unique,
  created_at timestamptz not null default now(),
  user_id uuid references public.users(id) on delete set null,
  subtotal numeric(12,2) not null default 0,
  item_discount numeric(12,2) not null default 0,
  order_discount numeric(12,2) not null default 0,
  discount_total numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  cost_total numeric(12,2) not null default 0,
  gross_profit numeric(12,2) not null default 0,
  payment_method text not null check (payment_method in ('cash','bkash','nagad','card','other')),
  amount_paid numeric(12,2) not null default 0,
  change_due numeric(12,2) not null default 0,
  status text not null default 'completed' check (status in ('completed','cancelled','returned','partially_returned')),
  returned_amount numeric(12,2) not null default 0,
  returned_cost numeric(12,2) not null default 0,
  item_count int not null default 0,
  customer_name text,
  customer_phone text,
  note text,
  cancelled_at timestamptz,
  cancel_reason text,
  client_ref uuid unique
);
alter table public.sales add column if not exists client_ref uuid unique;
create index if not exists sales_created_idx on public.sales (created_at desc);

create table if not exists public.sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.sales(id) on delete restrict,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  product_code text not null,
  size text not null default '',
  color text not null default '',
  quantity int not null check (quantity > 0),
  unit_cost numeric(12,2) not null,
  unit_price numeric(12,2) not null,
  discount numeric(12,2) not null default 0,
  line_total numeric(12,2) not null,
  net_total numeric(12,2) not null,
  cost_total numeric(12,2) not null,
  profit numeric(12,2) not null,
  returned_qty int not null default 0 check (returned_qty >= 0)
);
create index if not exists sale_items_sale_idx on public.sale_items (sale_id);

-- ---------- RETURNS ----------
create table if not exists public.returns (
  id uuid primary key default gen_random_uuid(),
  return_no text not null unique,
  sale_id uuid not null references public.sales(id) on delete restrict,
  created_at timestamptz not null default now(),
  user_id uuid references public.users(id) on delete set null,
  reason text not null check (reason in ('size_issue','defective','wrong_product','changed_mind','other')),
  note text,
  refund_amount numeric(12,2) not null default 0,
  cost_amount numeric(12,2) not null default 0,
  profit_adjustment numeric(12,2) not null default 0,
  item_count int not null default 0
);
create index if not exists returns_created_idx on public.returns (created_at desc);

create table if not exists public.return_items (
  id uuid primary key default gen_random_uuid(),
  return_id uuid not null references public.returns(id) on delete restrict,
  sale_item_id uuid not null references public.sale_items(id) on delete restrict,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  quantity int not null check (quantity > 0),
  refund_amount numeric(12,2) not null,
  cost_amount numeric(12,2) not null
);

-- ---------- EXPENSES ----------
create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category in ('rent','electricity','internet','transport','packaging','staff_salary','food_tea','repair','delivery','other')),
  amount numeric(12,2) not null check (amount > 0),
  note text,
  expense_date date not null default (now() at time zone 'Asia/Dhaka')::date,
  user_id uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists expenses_date_idx on public.expenses (expense_date desc);

-- ---------- STOCK MOVEMENTS ----------
create table if not exists public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete restrict,
  quantity int not null,
  type text not null check (type in ('stock_in','sale','return','adjustment')),
  reference text,
  note text,
  balance_after int not null,
  user_id uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists stock_movements_created_idx on public.stock_movements (created_at desc);
create index if not exists stock_movements_product_idx on public.stock_movements (product_id);

-- ---------- DAILY CLOSING ----------
create table if not exists public.daily_closing (
  id uuid primary key default gen_random_uuid(),
  closing_date date not null unique,
  orders int not null default 0,
  items_sold int not null default 0,
  total_sales numeric(12,2) not null default 0,
  total_cost numeric(12,2) not null default 0,
  gross_profit numeric(12,2) not null default 0,
  expenses numeric(12,2) not null default 0,
  returns numeric(12,2) not null default 0,
  return_adjustment numeric(12,2) not null default 0,
  net_profit numeric(12,2) not null default 0,
  cash numeric(12,2) not null default 0,
  bkash numeric(12,2) not null default 0,
  nagad numeric(12,2) not null default 0,
  card numeric(12,2) not null default 0,
  other numeric(12,2) not null default 0,
  note text,
  closed_by uuid references public.users(id) on delete set null,
  closed_at timestamptz not null default now()
);

-- ---------- COUNTERS (invoice / return numbers) ----------
create table if not exists public.doc_counters (
  prefix text not null,
  day date not null,
  last_value int not null default 0,
  primary key (prefix, day)
);

-- ---------- ROW LEVEL SECURITY ----------
-- All access goes through the Next.js server using the service-role key.
-- RLS is enabled with no policies so the public anon key can read/write nothing.
alter table public.users enable row level security;
alter table public.settings enable row level security;
alter table public.products enable row level security;
alter table public.sales enable row level security;
alter table public.sale_items enable row level security;
alter table public.returns enable row level security;
alter table public.return_items enable row level security;
alter table public.expenses enable row level security;
alter table public.stock_movements enable row level security;
alter table public.daily_closing enable row level security;
alter table public.doc_counters enable row level security;

-- =====================================================================
-- FUNCTIONS (all run in one transaction each)
-- =====================================================================

create or replace function public.next_doc_no(p_prefix text)
returns text language plpgsql as $$
declare v_day date := (now() at time zone 'Asia/Dhaka')::date; v_n int;
begin
  insert into public.doc_counters (prefix, day, last_value) values (p_prefix, v_day, 1)
  on conflict (prefix, day) do update set last_value = public.doc_counters.last_value + 1
  returning last_value into v_n;
  return p_prefix || '-' || to_char(v_day, 'YYMMDD') || '-' || lpad(v_n::text, 4, '0');
end $$;

drop function if exists public.complete_sale(jsonb, numeric, text, numeric, uuid, text, text, text);
-- Complete a sale: validates stock, stores sale + items, reduces stock, logs movements.
-- p_items: [{ "product_id": uuid, "quantity": int, "discount": number }]
create or replace function public.complete_sale(
  p_items jsonb, p_order_discount numeric, p_payment_method text, p_amount_paid numeric,
  p_user uuid default null, p_customer_name text default null, p_customer_phone text default null, p_note text default null,
  p_client_ref uuid default null
) returns jsonb language plpgsql as $$
declare
  v_item jsonb; v_prod public.products%rowtype; v_qty int; v_disc numeric; v_line numeric;
  v_subtotal numeric := 0; v_item_disc numeric := 0; v_after_items numeric := 0; v_order_disc numeric := greatest(coalesce(p_order_discount,0),0);
  v_total numeric; v_cost numeric := 0; v_sale_id uuid; v_invoice text; v_count int := 0; v_alloc numeric; v_alloc_left numeric; v_net numeric;
  v_idx int := 0; v_n int; v_new_stock int; v_existing public.sales%rowtype;
begin
  -- idempotency: the same checkout submitted twice (e.g. network retry) returns the first sale
  if p_client_ref is not null then
    select * into v_existing from public.sales where client_ref = p_client_ref;
    if found then return jsonb_build_object('id', v_existing.id, 'invoice_no', v_existing.invoice_no, 'total', v_existing.total, 'duplicate', true); end if;
  end if;
  if p_items is null or jsonb_array_length(p_items) = 0 then raise exception 'Cart is empty'; end if;
  if p_payment_method not in ('cash','bkash','nagad','card','other') then raise exception 'Invalid payment method'; end if;
  v_n := jsonb_array_length(p_items);

  -- pass 1: validate + totals
  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty := (v_item->>'quantity')::int;
    v_disc := greatest(coalesce((v_item->>'discount')::numeric, 0), 0);
    if v_qty is null or v_qty <= 0 then raise exception 'Invalid quantity'; end if;
    select * into v_prod from public.products where id = (v_item->>'product_id')::uuid for update;
    if not found then raise exception 'Product not found'; end if;
    if v_prod.status <> 'active' then raise exception 'Product % is inactive', v_prod.code; end if;
    if v_prod.stock_quantity < v_qty then raise exception 'Not enough stock for % (% available)', v_prod.name || ' [' || v_prod.code || ']', v_prod.stock_quantity; end if;
    v_line := v_prod.selling_price * v_qty;
    if v_disc > v_line then raise exception 'Discount is larger than item price for %', v_prod.code; end if;
    v_subtotal := v_subtotal + v_line; v_item_disc := v_item_disc + v_disc; v_cost := v_cost + v_prod.cost_price * v_qty; v_count := v_count + v_qty;
  end loop;
  v_after_items := v_subtotal - v_item_disc;
  if v_order_disc > v_after_items then raise exception 'Discount is larger than the total'; end if;
  v_total := round(v_after_items - v_order_disc, 2);
  if coalesce(p_amount_paid, 0) < v_total then raise exception 'Amount paid is less than the total'; end if;

  v_invoice := public.next_doc_no('BM');
  insert into public.sales (invoice_no, user_id, subtotal, item_discount, order_discount, discount_total, total, cost_total, gross_profit, payment_method, amount_paid, change_due, item_count, customer_name, customer_phone, note, client_ref)
  values (v_invoice, p_user, v_subtotal, v_item_disc, v_order_disc, v_item_disc + v_order_disc, v_total, v_cost, v_total - v_cost, p_payment_method, p_amount_paid, round(p_amount_paid - v_total, 2), v_count, nullif(trim(p_customer_name),''), nullif(trim(p_customer_phone),''), nullif(trim(p_note),''), p_client_ref)
  returning id into v_sale_id;

  -- pass 2: items (order discount allocated proportionally; remainder on last line)
  v_alloc_left := v_order_disc;
  for v_item in select * from jsonb_array_elements(p_items) loop
    v_idx := v_idx + 1;
    v_qty := (v_item->>'quantity')::int;
    v_disc := greatest(coalesce((v_item->>'discount')::numeric, 0), 0);
    select * into v_prod from public.products where id = (v_item->>'product_id')::uuid;
    v_line := v_prod.selling_price * v_qty - v_disc;
    if v_idx = v_n then v_alloc := v_alloc_left;
    elsif v_after_items > 0 then v_alloc := round(v_order_disc * v_line / v_after_items, 2);
    else v_alloc := 0; end if;
    v_alloc := least(v_alloc, v_line); v_alloc_left := v_alloc_left - v_alloc;
    v_net := v_line - v_alloc;
    insert into public.sale_items (sale_id, product_id, product_name, product_code, size, color, quantity, unit_cost, unit_price, discount, line_total, net_total, cost_total, profit)
    values (v_sale_id, v_prod.id, v_prod.name, v_prod.code, v_prod.size, v_prod.color, v_qty, v_prod.cost_price, v_prod.selling_price, v_disc, v_line, v_net, v_prod.cost_price * v_qty, v_net - v_prod.cost_price * v_qty);
    update public.products set stock_quantity = stock_quantity - v_qty, updated_at = now() where id = v_prod.id returning stock_quantity into v_new_stock;
    insert into public.stock_movements (product_id, quantity, type, reference, balance_after, user_id) values (v_prod.id, -v_qty, 'sale', v_invoice, v_new_stock, p_user);
  end loop;

  return jsonb_build_object('id', v_sale_id, 'invoice_no', v_invoice, 'total', v_total);
end $$;

-- Process a return against a sale.
-- p_items: [{ "sale_item_id": uuid, "quantity": int }]
create or replace function public.process_return(
  p_sale_id uuid, p_items jsonb, p_reason text, p_note text default null, p_user uuid default null
) returns jsonb language plpgsql as $$
declare
  v_sale public.sales%rowtype; v_item jsonb; v_si public.sale_items%rowtype; v_qty int; v_refund numeric; v_cost numeric;
  v_tot_refund numeric := 0; v_tot_cost numeric := 0; v_count int := 0; v_return_id uuid; v_return_no text; v_new_stock int;
  v_sold int; v_returned int;
begin
  select * into v_sale from public.sales where id = p_sale_id for update;
  if not found then raise exception 'Sale not found'; end if;
  if v_sale.status = 'cancelled' then raise exception 'This sale was cancelled'; end if;
  if v_sale.status = 'returned' then raise exception 'All items of this sale are already returned'; end if;
  if p_items is null or jsonb_array_length(p_items) = 0 then raise exception 'Select at least one item to return'; end if;
  if p_reason not in ('size_issue','defective','wrong_product','changed_mind','other') then raise exception 'Invalid return reason'; end if;

  v_return_no := public.next_doc_no('RT');
  insert into public.returns (return_no, sale_id, user_id, reason, note) values (v_return_no, p_sale_id, p_user, p_reason, nullif(trim(p_note),'')) returning id into v_return_id;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty := (v_item->>'quantity')::int;
    if v_qty is null or v_qty <= 0 then continue; end if;
    select * into v_si from public.sale_items where id = (v_item->>'sale_item_id')::uuid and sale_id = p_sale_id for update;
    if not found then raise exception 'Item does not belong to this sale'; end if;
    if v_si.returned_qty + v_qty > v_si.quantity then raise exception 'Cannot return more than sold for % (% left)', v_si.product_code, v_si.quantity - v_si.returned_qty; end if;
    -- last unit(s) take the exact remainder so totals always reconcile
    if v_si.returned_qty + v_qty = v_si.quantity then
      v_refund := v_si.net_total - round(v_si.net_total / v_si.quantity * v_si.returned_qty, 2);
      v_cost := v_si.cost_total - round(v_si.cost_total / v_si.quantity * v_si.returned_qty, 2);
    else
      v_refund := round(v_si.net_total / v_si.quantity * (v_si.returned_qty + v_qty), 2) - round(v_si.net_total / v_si.quantity * v_si.returned_qty, 2);
      v_cost := round(v_si.cost_total / v_si.quantity * (v_si.returned_qty + v_qty), 2) - round(v_si.cost_total / v_si.quantity * v_si.returned_qty, 2);
    end if;
    update public.sale_items set returned_qty = returned_qty + v_qty where id = v_si.id;
    insert into public.return_items (return_id, sale_item_id, product_id, product_name, quantity, refund_amount, cost_amount) values (v_return_id, v_si.id, v_si.product_id, v_si.product_name, v_qty, v_refund, v_cost);
    if v_si.product_id is not null then
      update public.products set stock_quantity = stock_quantity + v_qty, updated_at = now() where id = v_si.product_id returning stock_quantity into v_new_stock;
      insert into public.stock_movements (product_id, quantity, type, reference, note, balance_after, user_id) values (v_si.product_id, v_qty, 'return', v_return_no, 'Return for ' || v_sale.invoice_no, v_new_stock, p_user);
    end if;
    v_tot_refund := v_tot_refund + v_refund; v_tot_cost := v_tot_cost + v_cost; v_count := v_count + v_qty;
  end loop;

  if v_count = 0 then raise exception 'Select at least one item to return'; end if;
  update public.returns set refund_amount = v_tot_refund, cost_amount = v_tot_cost, profit_adjustment = v_tot_refund - v_tot_cost, item_count = v_count where id = v_return_id;

  select sum(quantity), sum(returned_qty) into v_sold, v_returned from public.sale_items where sale_id = p_sale_id;
  update public.sales set returned_amount = returned_amount + v_tot_refund, returned_cost = returned_cost + v_tot_cost,
    status = case when v_returned >= v_sold then 'returned' else 'partially_returned' end where id = p_sale_id;

  return jsonb_build_object('id', v_return_id, 'return_no', v_return_no, 'refund_amount', v_tot_refund);
end $$;

-- Cancel a whole sale (only if nothing was returned yet). Restores stock; sale row is kept.
create or replace function public.cancel_sale(p_sale_id uuid, p_reason text default null, p_user uuid default null)
returns void language plpgsql as $$
declare v_sale public.sales%rowtype; v_si public.sale_items%rowtype; v_new_stock int;
begin
  select * into v_sale from public.sales where id = p_sale_id for update;
  if not found then raise exception 'Sale not found'; end if;
  if v_sale.status <> 'completed' then raise exception 'Only completed sales without returns can be cancelled'; end if;
  for v_si in select * from public.sale_items where sale_id = p_sale_id loop
    if v_si.product_id is not null then
      update public.products set stock_quantity = stock_quantity + v_si.quantity, updated_at = now() where id = v_si.product_id returning stock_quantity into v_new_stock;
      insert into public.stock_movements (product_id, quantity, type, reference, note, balance_after, user_id) values (v_si.product_id, v_si.quantity, 'adjustment', v_sale.invoice_no, 'Sale cancelled', v_new_stock, p_user);
    end if;
  end loop;
  update public.sales set status = 'cancelled', cancelled_at = now(), cancel_reason = nullif(trim(p_reason),'') where id = p_sale_id;
end $$;

-- Stock in / adjustment. p_qty is signed for adjustments, positive for stock_in.
create or replace function public.adjust_stock(p_product_id uuid, p_qty int, p_type text, p_note text default null, p_user uuid default null)
returns int language plpgsql as $$
declare v_new int; v_ref text;
begin
  if p_type not in ('stock_in','adjustment') then raise exception 'Invalid movement type'; end if;
  if p_qty = 0 then raise exception 'Quantity cannot be zero'; end if;
  if p_type = 'stock_in' and p_qty < 0 then raise exception 'Stock in quantity must be positive'; end if;
  update public.products set stock_quantity = stock_quantity + p_qty, updated_at = now() where id = p_product_id returning stock_quantity into v_new;
  if not found then raise exception 'Product not found'; end if;
  if v_new < 0 then raise exception 'Stock cannot go below zero'; end if;
  v_ref := case when p_type = 'stock_in' then 'STOCK-IN' else 'ADJUST' end;
  insert into public.stock_movements (product_id, quantity, type, reference, note, balance_after, user_id) values (p_product_id, p_qty, p_type, v_ref, nullif(trim(p_note),''), v_new, p_user);
  return v_new;
end $$;

-- PIN helpers (hashing happens inside the database). SECURITY DEFINER so they can use pgcrypto in the extensions schema.
create or replace function public.create_pos_user(p_name text, p_role text, p_pin text)
returns uuid language plpgsql security definer set search_path = public, extensions as $$
declare v_id uuid;
begin
  if length(coalesce(p_pin,'')) < 4 then raise exception 'PIN must be at least 4 digits'; end if;
  insert into public.users (name, role, pin_hash) values (trim(p_name), p_role, extensions.crypt(p_pin, extensions.gen_salt('bf'))) returning id into v_id;
  return v_id;
end $$;

create or replace function public.set_user_pin(p_user uuid, p_pin text)
returns void language plpgsql security definer set search_path = public, extensions as $$
begin
  if length(coalesce(p_pin,'')) < 4 then raise exception 'PIN must be at least 4 digits'; end if;
  update public.users set pin_hash = extensions.crypt(p_pin, extensions.gen_salt('bf')) where id = p_user;
end $$;

create or replace function public.verify_user_pin(p_user uuid, p_pin text)
returns boolean language sql stable security definer set search_path = public, extensions as $$
  select exists (select 1 from public.users where id = p_user and active and pin_hash = extensions.crypt(p_pin, pin_hash));
$$;

-- Only the server (service role) may call these functions.
revoke execute on all functions in schema public from public, anon, authenticated;
grant execute on all functions in schema public to service_role;

-- ---------- DEFAULT ADMIN (PIN 1234 — change it in Settings) ----------
insert into public.users (name, role, pin_hash)
select 'Admin', 'admin', extensions.crypt('1234', extensions.gen_salt('bf'))
where not exists (select 1 from public.users);

-- ---------- STORAGE BUCKET for product images ----------
insert into storage.buckets (id, name, public) values ('product-images', 'product-images', true) on conflict (id) do nothing;
