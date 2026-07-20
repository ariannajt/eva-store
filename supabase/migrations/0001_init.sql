-- ============================================================================
-- Catálogo Tienda - Esquema inicial de base de datos
-- ============================================================================
-- Este archivo crea todas las tablas, funciones y reglas de seguridad (RLS)
-- que usa la aplicación. Se ejecuta una sola vez al crear el proyecto de
-- Supabase (ver README.md para instrucciones paso a paso).
--
-- Estructura del archivo:
--   1. Extensiones
--   2. Tablas
--   3. Funciones de negocio (RPC) -> stock, ventas, márgenes
--   4. Row Level Security (quién puede leer/escribir qué)
--   5. Buckets de almacenamiento (fotos y comprobantes)
-- ============================================================================

create extension if not exists pgcrypto;

-- ----------------------------------------------------------------------------
-- 1. TABLAS
-- ----------------------------------------------------------------------------

create table categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

create table products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text default '',
  category_id uuid references categories(id) on delete set null,
  price numeric(12,2) not null default 0,        -- precio de venta actual
  cost numeric(12,2) not null default 0,          -- costo promedio (se recalcula al cargar lotes)
  stock integer not null default 0,
  amazon_url text,
  discount_percent numeric(5,2) not null default 0,
  discount_active boolean not null default false,
  active boolean not null default true,           -- visible en el catálogo público
  views_count integer not null default 0,
  sold_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  url text not null,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

-- Un "lote de compra": cada vez que reponen stock de un producto.
-- unit_cost se calcula solo (precio total + envío, dividido entre la cantidad).
create table purchase_lots (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  quantity integer not null check (quantity > 0),
  purchase_total numeric(12,2) not null default 0,
  shipping_total numeric(12,2) not null default 0,
  unit_cost numeric(12,2) generated always as
    (round((purchase_total + shipping_total) / nullif(quantity, 0), 2)) stored,
  note text default '',
  created_at timestamptz not null default now()
);

create table payment_methods (
  id uuid primary key default gen_random_uuid(),
  name text not null,             -- ej. "Transferencia bancaria", "Pago móvil"
  details text not null default '', -- datos a copiar (cuenta, cédula, banco, etc.)
  active boolean not null default true,
  position integer not null default 0
);

create table orders (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null default '',
  customer_contact text not null default '',
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'rejected', 'manual')),
  sale_type text not null default 'online'
    check (sale_type in ('online', 'manual')),
  payment_method_id uuid references payment_methods(id) on delete set null,
  payment_screenshot_url text,
  subtotal numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  notes text default '',
  created_at timestamptz not null default now(),
  confirmed_at timestamptz,
  confirmed_by uuid references auth.users(id)
);

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  product_name text not null,     -- copia del nombre al momento de la venta
  quantity integer not null check (quantity > 0),
  unit_price numeric(12,2) not null,  -- precio ya con descuento aplicado
  unit_cost numeric(12,2) not null    -- costo al momento de la venta (para el margen)
);

-- Historial de movimientos de stock, para poder auditar qué pasó con cada unidad.
create table stock_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) on delete set null,
  order_id uuid references orders(id) on delete set null,
  quantity_change integer not null, -- negativo = sale stock, positivo = entra stock
  reason text not null
    check (reason in ('purchase_lot', 'online_reserve', 'online_restore', 'manual_sale', 'manual_adjustment')),
  created_at timestamptz not null default now()
);

create index idx_product_images_product on product_images(product_id);
create index idx_purchase_lots_product on purchase_lots(product_id);
create index idx_order_items_order on order_items(order_id);
create index idx_order_items_product on order_items(product_id);
create index idx_orders_status on orders(status);
create index idx_orders_created_at on orders(created_at);
create index idx_stock_movements_product on stock_movements(product_id);

-- ----------------------------------------------------------------------------
-- 2. FUNCIONES DE NEGOCIO (RPC)
-- ----------------------------------------------------------------------------
-- Se usan "SECURITY DEFINER" para que puedan modificar varias tablas a la vez
-- de forma segura y atómica, sin que el cliente (navegador) tenga permiso
-- directo para tocar stock, ventas o costos.

-- Registrar un nuevo lote de compra: suma el stock y recalcula el costo
-- promedio del producto (promedio ponderado de todos los lotes históricos).
create or replace function add_purchase_lot(
  p_product_id uuid,
  p_quantity integer,
  p_purchase_total numeric,
  p_shipping_total numeric,
  p_note text default ''
) returns purchase_lots
language plpgsql security definer set search_path = public as $$
declare
  v_lot purchase_lots;
  v_avg_cost numeric;
begin
  insert into purchase_lots (product_id, quantity, purchase_total, shipping_total, note)
  values (p_product_id, p_quantity, p_purchase_total, p_shipping_total, p_note)
  returning * into v_lot;

  select round(sum(purchase_total + shipping_total) / sum(quantity), 2)
  into v_avg_cost
  from purchase_lots
  where product_id = p_product_id;

  update products
  set stock = stock + p_quantity,
      cost = coalesce(v_avg_cost, cost),
      updated_at = now()
  where id = p_product_id;

  insert into stock_movements (product_id, quantity_change, reason)
  values (p_product_id, p_quantity, 'purchase_lot');

  return v_lot;
end;
$$;

-- Crear un pedido desde el catálogo público (cliente).
-- p_items: jsonb con formato [{"product_id": "...", "quantity": 2}, ...]
-- El stock se descuenta de inmediato (queda "reservado") para evitar
-- vender el mismo artículo dos veces mientras se confirma el pago.
create or replace function create_online_order(
  p_customer_name text,
  p_customer_contact text,
  p_payment_method_id uuid,
  p_payment_screenshot_url text,
  p_items jsonb,
  p_notes text default ''
) returns orders
language plpgsql security definer set search_path = public as $$
declare
  v_order orders;
  v_item jsonb;
  v_product products;
  v_effective_price numeric;
  v_subtotal numeric := 0;
begin
  if jsonb_array_length(p_items) = 0 then
    raise exception 'El pedido no tiene artículos';
  end if;

  -- Validar stock disponible antes de tocar nada
  for v_item in select * from jsonb_array_elements(p_items) loop
    select * into v_product from products where id = (v_item->>'product_id')::uuid for update;
    if v_product is null then
      raise exception 'Producto % no existe', v_item->>'product_id';
    end if;
    if v_product.stock < (v_item->>'quantity')::integer then
      raise exception 'Stock insuficiente para "%": quedan %, pidieron %',
        v_product.name, v_product.stock, v_item->>'quantity';
    end if;
  end loop;

  insert into orders (customer_name, customer_contact, payment_method_id, payment_screenshot_url, notes, status, sale_type)
  values (p_customer_name, p_customer_contact, p_payment_method_id, p_payment_screenshot_url, p_notes, 'pending', 'online')
  returning * into v_order;

  for v_item in select * from jsonb_array_elements(p_items) loop
    select * into v_product from products where id = (v_item->>'product_id')::uuid;
    v_effective_price := case
      when v_product.discount_active then round(v_product.price * (1 - v_product.discount_percent / 100), 2)
      else v_product.price
    end;
    v_subtotal := v_subtotal + v_effective_price * (v_item->>'quantity')::integer;

    insert into order_items (order_id, product_id, product_name, quantity, unit_price, unit_cost)
    values (v_order.id, v_product.id, v_product.name, (v_item->>'quantity')::integer, v_effective_price, v_product.cost);

    update products set stock = stock - (v_item->>'quantity')::integer where id = v_product.id;

    insert into stock_movements (product_id, order_id, quantity_change, reason)
    values (v_product.id, v_order.id, -1 * (v_item->>'quantity')::integer, 'online_reserve');
  end loop;

  update orders set subtotal = v_subtotal, total = v_subtotal where id = v_order.id
  returning * into v_order;

  return v_order;
end;
$$;

-- Confirmar un pedido pendiente: el pago fue verificado. El stock ya se
-- había descontado al crear el pedido, así que solo se marca como vendido.
create or replace function confirm_order(p_order_id uuid) returns orders
language plpgsql security definer set search_path = public as $$
declare
  v_order orders;
begin
  update orders
  set status = 'confirmed', confirmed_at = now(), confirmed_by = auth.uid()
  where id = p_order_id and status = 'pending'
  returning * into v_order;

  if v_order is null then
    raise exception 'El pedido no existe o ya fue procesado';
  end if;

  update products p
  set sold_count = sold_count + oi.quantity
  from order_items oi
  where oi.order_id = p_order_id and oi.product_id = p.id;

  return v_order;
end;
$$;

-- Rechazar un pedido pendiente: el pago no se pudo verificar, así que el
-- stock reservado vuelve a estar disponible.
create or replace function reject_order(p_order_id uuid) returns orders
language plpgsql security definer set search_path = public as $$
declare
  v_order orders;
  v_item record;
begin
  update orders set status = 'rejected' where id = p_order_id and status = 'pending'
  returning * into v_order;

  if v_order is null then
    raise exception 'El pedido no existe o ya fue procesado';
  end if;

  for v_item in select * from order_items where order_id = p_order_id loop
    if v_item.product_id is not null then
      update products set stock = stock + v_item.quantity where id = v_item.product_id;
      insert into stock_movements (product_id, order_id, quantity_change, reason)
      values (v_item.product_id, p_order_id, v_item.quantity, 'online_restore');
    end if;
  end loop;

  return v_order;
end;
$$;

-- Registrar una venta hecha fuera de la página (ej. en el local, por WhatsApp, etc.)
create or replace function create_manual_sale(
  p_items jsonb,
  p_customer_name text default '',
  p_notes text default ''
) returns orders
language plpgsql security definer set search_path = public as $$
declare
  v_order orders;
  v_item jsonb;
  v_product products;
  v_subtotal numeric := 0;
begin
  if jsonb_array_length(p_items) = 0 then
    raise exception 'La venta no tiene artículos';
  end if;

  for v_item in select * from jsonb_array_elements(p_items) loop
    select * into v_product from products where id = (v_item->>'product_id')::uuid for update;
    if v_product is null then
      raise exception 'Producto % no existe', v_item->>'product_id';
    end if;
    if v_product.stock < (v_item->>'quantity')::integer then
      raise exception 'Stock insuficiente para "%"', v_product.name;
    end if;
  end loop;

  insert into orders (customer_name, notes, status, sale_type)
  values (p_customer_name, p_notes, 'manual', 'manual')
  returning * into v_order;

  for v_item in select * from jsonb_array_elements(p_items) loop
    select * into v_product from products where id = (v_item->>'product_id')::uuid;
    v_subtotal := v_subtotal + coalesce((v_item->>'unit_price')::numeric, v_product.price) * (v_item->>'quantity')::integer;

    insert into order_items (order_id, product_id, product_name, quantity, unit_price, unit_cost)
    values (v_order.id, v_product.id, v_product.name, (v_item->>'quantity')::integer,
            coalesce((v_item->>'unit_price')::numeric, v_product.price), v_product.cost);

    update products
    set stock = stock - (v_item->>'quantity')::integer,
        sold_count = sold_count + (v_item->>'quantity')::integer
    where id = v_product.id;

    insert into stock_movements (product_id, order_id, quantity_change, reason)
    values (v_product.id, v_order.id, -1 * (v_item->>'quantity')::integer, 'manual_sale');
  end loop;

  update orders set subtotal = v_subtotal, total = v_subtotal, confirmed_at = now(), confirmed_by = auth.uid()
  where id = v_order.id
  returning * into v_order;

  return v_order;
end;
$$;

-- Suma 1 vista a un producto (se llama desde la página pública de detalle).
create or replace function increment_product_views(p_product_id uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  update products set views_count = views_count + 1 where id = p_product_id;
end;
$$;

-- ----------------------------------------------------------------------------
-- 3. ROW LEVEL SECURITY
-- ----------------------------------------------------------------------------
-- "anon" = cualquier visitante de la página pública.
-- "authenticated" = ustedes, una vez logueados en el panel de administración.

alter table categories enable row level security;
alter table products enable row level security;
alter table product_images enable row level security;
alter table purchase_lots enable row level security;
alter table payment_methods enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table stock_movements enable row level security;

-- Categorías: todos pueden ver, solo el admin puede editar
create policy "categorias: lectura publica" on categories for select using (true);
create policy "categorias: solo admin escribe" on categories for all using (auth.role() = 'authenticated');

-- Productos: público ve solo los activos, admin ve y edita todo
create policy "productos: lectura publica de activos" on products for select using (active = true);
create policy "productos: admin lee todo" on products for select using (auth.role() = 'authenticated');
create policy "productos: solo admin escribe" on products for insert with check (auth.role() = 'authenticated');
create policy "productos: solo admin actualiza" on products for update using (auth.role() = 'authenticated');
create policy "productos: solo admin borra" on products for delete using (auth.role() = 'authenticated');

-- Fotos de producto: lectura pública, solo admin escribe
create policy "fotos: lectura publica" on product_images for select using (true);
create policy "fotos: solo admin escribe" on product_images for all using (auth.role() = 'authenticated');

-- Lotes de compra: solo el admin los ve y gestiona (información de costos)
create policy "lotes: solo admin" on purchase_lots for all using (auth.role() = 'authenticated');

-- Métodos de pago: público ve los activos, admin gestiona todos
create policy "metodos_pago: lectura publica de activos" on payment_methods for select using (active = true);
create policy "metodos_pago: admin lee todo" on payment_methods for select using (auth.role() = 'authenticated');
create policy "metodos_pago: solo admin escribe" on payment_methods for all using (auth.role() = 'authenticated');

-- Pedidos y sus items: no se leen/escriben directo, todo pasa por las
-- funciones de arriba (create_online_order, confirm_order, etc.), excepto
-- que el admin sí puede listarlos y editar notas desde el panel.
create policy "pedidos: solo admin lee" on orders for select using (auth.role() = 'authenticated');
create policy "pedidos: solo admin actualiza" on orders for update using (auth.role() = 'authenticated');
create policy "items: solo admin lee" on order_items for select using (auth.role() = 'authenticated');
create policy "movimientos: solo admin lee" on stock_movements for select using (auth.role() = 'authenticated');

-- ----------------------------------------------------------------------------
-- 4. BUCKETS DE ALMACENAMIENTO (fotos de productos y comprobantes de pago)
-- ----------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('payment-screenshots', 'payment-screenshots', true)
on conflict (id) do nothing;

create policy "product-images: lectura publica"
  on storage.objects for select using (bucket_id = 'product-images');
create policy "product-images: solo admin sube/borra"
  on storage.objects for all using (bucket_id = 'product-images' and auth.role() = 'authenticated');

create policy "payment-screenshots: cualquiera puede subir su comprobante"
  on storage.objects for insert with check (bucket_id = 'payment-screenshots');
create policy "payment-screenshots: lectura publica por url directa"
  on storage.objects for select using (bucket_id = 'payment-screenshots');
