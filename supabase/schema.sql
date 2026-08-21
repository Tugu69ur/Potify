-- MINIMAL store schema
-- Paste this into Supabase → SQL Editor → Run

create extension if not exists "pgcrypto";

-- Ready-made shop items
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  master_category text,
  gender text,
  price_mnt integer not null check (price_mnt >= 0),
  sku text,
  sizes text[] not null default array['XS', 'S', 'M', 'L', 'XL'],
  colors text[] not null default array['Black'],
  stock_quantity integer check (stock_quantity is null or stock_quantity >= 0),
  description text,
  image_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Custom print + shop orders
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  phone text not null,
  email text,
  address text,
  note text,
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'printing', 'shipped', 'done', 'cancelled')),
  total_mnt integer not null default 0 check (total_mnt >= 0),
  created_at timestamptz not null default now()
);

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders (id) on delete cascade,
  kind text not null check (kind in ('ready_made', 'custom_print')),
  product_id uuid references products (id),
  title text not null,
  quantity integer not null default 1 check (quantity > 0),
  unit_price_mnt integer not null check (unit_price_mnt >= 0),
  -- custom print: { product, color, size, scale, position }
  print_config jsonb,
  design_url text
);

create table if not exists contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  subject text not null,
  message text not null,
  created_at timestamptz not null default now()
);

-- Kept separate from the initial create statements so this file also upgrades
-- projects that were created before customer accounts and payments were added.
alter table orders
  add column if not exists user_id uuid references auth.users (id),
  add column if not exists payment_method text not null default 'cash_on_delivery'
    check (payment_method in ('cash_on_delivery', 'qpay')),
  add column if not exists payment_status text not null default 'unpaid'
    check (payment_status in ('unpaid', 'pending', 'paid', 'failed', 'expired', 'refunded')),
  add column if not exists payment_provider text,
  add column if not exists payment_invoice_id text unique,
  add column if not exists payment_id text unique,
  add column if not exists paid_at timestamptz,
  add column if not exists delivery_fee_mnt integer not null default 0
    check (delivery_fee_mnt >= 0);

alter table products
  add column if not exists sku text,
  add column if not exists sizes text[] not null default array['XS', 'S', 'M', 'L', 'XL'],
  add column if not exists colors text[] not null default array['Black'],
  add column if not exists stock_quantity integer
    check (stock_quantity is null or stock_quantity >= 0);

-- Public can browse products
alter table products enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table contact_messages enable row level security;

-- Admin access must be granted by a trusted server with:
-- supabase.auth.admin.updateUserById(userId, { app_metadata: { role: 'admin' } })
-- Never set app_metadata from the browser or use user_metadata for authorization.
create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false);
$$;

drop policy if exists "products_public_read" on products;
create policy "products_public_read"
  on products for select
  using (is_active = true);

drop policy if exists "admins_manage_products" on products;
create policy "admins_manage_products"
  on products for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Customers can only read their own orders. Product prices and order totals are
-- calculated by create_checkout_order below, never trusted from the browser.
drop policy if exists "orders_public_insert" on orders;
drop policy if exists "users_read_own_orders" on orders;
create policy "users_read_own_orders"
  on orders for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "order_items_public_insert" on order_items;
drop policy if exists "users_read_own_order_items" on order_items;
create policy "users_read_own_order_items"
  on order_items for select
  to authenticated
  using (
    exists (
      select 1 from orders
      where orders.id = order_items.order_id
        and orders.user_id = auth.uid()
    )
  );

drop policy if exists "contact_public_insert" on contact_messages;
create policy "contact_public_insert"
  on contact_messages for insert
  with check (true);

-- Administrative data access is enforced in the database, not only in the UI.
drop policy if exists "admins_read_orders" on orders;
create policy "admins_read_orders"
  on orders for select
  to authenticated
  using (public.is_admin());

drop policy if exists "admins_update_orders" on orders;
create policy "admins_update_orders"
  on orders for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "admins_read_order_items" on order_items;
create policy "admins_read_order_items"
  on order_items for select
  to authenticated
  using (public.is_admin());

drop policy if exists "admins_read_contact_messages" on contact_messages;
create policy "admins_read_contact_messages"
  on contact_messages for select
  to authenticated
  using (public.is_admin());

-- Creates a ready-made order atomically and reads prices/titles from products.
-- This prevents a browser user from changing a product price or order total.
create or replace function public.create_checkout_order(
  p_customer_name text,
  p_phone text,
  p_email text,
  p_address text,
  p_items jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id uuid;
  v_item jsonb;
  v_product products%rowtype;
  v_quantity integer;
  v_size text;
  v_color text;
  v_total integer := 0;
begin
  if auth.uid() is null then
    raise exception 'You must sign in before checking out.';
  end if;

  if coalesce(trim(p_customer_name), '') = ''
    or coalesce(trim(p_phone), '') = ''
    or coalesce(trim(p_address), '') = '' then
    raise exception 'Name, phone number, and delivery address are required.';
  end if;

  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Your cart is empty.';
  end if;

  if jsonb_array_length(p_items) > 25 then
    raise exception 'A maximum of 25 different products can be ordered at once.';
  end if;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    v_quantity := coalesce((v_item ->> 'quantity')::integer, 0);

    if v_quantity < 1 or v_quantity > 20 then
      raise exception 'Each product quantity must be between 1 and 20.';
    end if;

    select * into v_product
    from products
    where id = (v_item ->> 'id')::uuid
      and is_active = true;

    if not found then
      raise exception 'A product in your cart is unavailable.';
    end if;

    v_size := coalesce(nullif(trim(v_item ->> 'size'), ''), v_product.sizes[1]);
    v_color := coalesce(nullif(trim(v_item ->> 'color'), ''), v_product.colors[1]);

    if v_size is null or not (v_size = any(v_product.sizes)) then
      raise exception 'The selected size is unavailable.';
    end if;

    if v_color is null or not (v_color = any(v_product.colors)) then
      raise exception 'The selected color is unavailable.';
    end if;

    if v_product.stock_quantity is not null
      and v_quantity > v_product.stock_quantity then
      raise exception 'Insufficient stock for %.', v_product.name;
    end if;

    v_total := v_total + (v_product.price_mnt * v_quantity);
  end loop;

  insert into orders (
    user_id, customer_name, phone, email, address, total_mnt,
    payment_method, payment_status
  ) values (
    auth.uid(), trim(p_customer_name), trim(p_phone), nullif(trim(p_email), ''),
    trim(p_address), v_total, 'cash_on_delivery', 'unpaid'
  ) returning id into v_order_id;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    select * into v_product
    from products
    where id = (v_item ->> 'id')::uuid
      and is_active = true;

    v_size := coalesce(nullif(trim(v_item ->> 'size'), ''), v_product.sizes[1]);
    v_color := coalesce(nullif(trim(v_item ->> 'color'), ''), v_product.colors[1]);

    insert into order_items (
      order_id, kind, product_id, title, quantity, unit_price_mnt, print_config
    ) values (
      v_order_id, 'ready_made', v_product.id, v_product.name,
      (v_item ->> 'quantity')::integer, v_product.price_mnt,
      jsonb_build_object('size', v_size, 'color', v_color, 'sku', v_product.sku)
    );
  end loop;

  return v_order_id;
end;
$$;

revoke all on function public.create_checkout_order(text, text, text, text, jsonb) from public;
grant execute on function public.create_checkout_order(text, text, text, text, jsonb) to authenticated;

-- Custom-print prices are also calculated in the database, rather than from a
-- browser-supplied total. The design path must belong to the signed-in user.
create or replace function public.create_custom_print_order(
  p_customer_name text,
  p_phone text,
  p_product text,
  p_color text,
  p_size text,
  p_scale numeric,
  p_position jsonb,
  p_design_path text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id uuid;
  v_price integer;
  v_user_prefix text := auth.uid()::text || '/';
begin
  if auth.uid() is null then
    raise exception 'You must sign in before checking out.';
  end if;

  if coalesce(trim(p_customer_name), '') = '' or coalesce(trim(p_phone), '') = '' then
    raise exception 'Name and phone number are required.';
  end if;

  v_price := case p_product
    when 'T-Shirt' then 45000
    when 'Hoodie' then 89000
    when 'Hat' then 35000
    else null
  end;

  if v_price is null or p_size not in ('XS', 'S', 'M', 'L', 'XL', 'XXL') then
    raise exception 'Invalid custom-print configuration.';
  end if;

  if p_design_path is null or left(p_design_path, length(v_user_prefix)) <> v_user_prefix then
    raise exception 'Invalid design file.';
  end if;

  insert into orders (
    user_id, customer_name, phone, email, total_mnt, note,
    payment_method, payment_status
  ) values (
    auth.uid(), trim(p_customer_name), trim(p_phone), auth.jwt() ->> 'email',
    v_price, format('%s %s / size %s', p_color, p_product, p_size),
    'cash_on_delivery', 'unpaid'
  ) returning id into v_order_id;

  insert into order_items (
    order_id, kind, product_id, title, quantity, unit_price_mnt, design_url, print_config
  ) values (
    v_order_id, 'custom_print', null, format('%s %s', p_color, p_product),
    1, v_price, p_design_path,
    jsonb_build_object(
      'product', p_product,
      'color', p_color,
      'size', p_size,
      'scale', p_scale,
      'position', p_position
    )
  );

  return v_order_id;
end;
$$;

revoke all on function public.create_custom_print_order(text, text, text, text, text, numeric, jsonb, text) from public;
grant execute on function public.create_custom_print_order(text, text, text, text, text, numeric, jsonb, text) to authenticated;

-- Custom print uploads (run even if you already created the bucket)
insert into storage.buckets (id, name, public)
values ('print-designs', 'print-designs', false)
on conflict (id) do nothing;

drop policy if exists "anon_upload_print_designs" on storage.objects;
drop policy if exists "users_upload_own_print_designs" on storage.objects;
create policy "users_upload_own_print_designs"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'print-designs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "admins_read_print_designs" on storage.objects;
create policy "admins_read_print_designs"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'print-designs' and public.is_admin());

-- The product-images bucket should be public for storefront image URLs, but only
-- admins may write to it.
drop policy if exists "admins_manage_product_images" on storage.objects;
create policy "admins_manage_product_images"
  on storage.objects for all
  to authenticated
  using (bucket_id = 'product-images' and public.is_admin())
  with check (bucket_id = 'product-images' and public.is_admin());

-- Example products (delete later if you add your own)
insert into products (name, category, master_category, gender, price_mnt, description, image_url)
values
  ('Essential Tee', 'T-Shirts', 'Tops', 'Unisex', 45000, 'Everyday cotton t-shirt.', null),
  ('Studio Hoodie', 'Hoodies', 'Tops', 'Unisex', 89000, 'Heavyweight hoodie for print.', null);
