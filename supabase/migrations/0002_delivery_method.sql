-- ----------------------------------------------------------------------------
-- Método de entrega del pedido: retiro en tienda, delivery local (Ciudad
-- Ojeda) o envío a otra ciudad/estado por encomienda (MRW, Zoom o Tealca,
-- cobro a destino).
-- ----------------------------------------------------------------------------

alter table orders
  add column delivery_method text not null default 'pickup'
    check (delivery_method in ('pickup', 'local_delivery', 'shipping')),
  add column delivery_address text,
  add column delivery_courier text
    check (delivery_courier is null or delivery_courier in ('mrw', 'zoom', 'tealca')),
  add column delivery_recipient_name text,
  add column delivery_recipient_lastname text,
  add column delivery_recipient_cedula text;

create or replace function create_online_order(
  p_customer_name text,
  p_customer_contact text,
  p_payment_method_id uuid,
  p_payment_screenshot_url text,
  p_items jsonb,
  p_notes text default '',
  p_delivery_method text default 'pickup',
  p_delivery_address text default null,
  p_delivery_courier text default null,
  p_delivery_recipient_name text default null,
  p_delivery_recipient_lastname text default null,
  p_delivery_recipient_cedula text default null
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

  insert into orders (
    customer_name, customer_contact, payment_method_id, payment_screenshot_url, notes, status, sale_type,
    delivery_method, delivery_address, delivery_courier,
    delivery_recipient_name, delivery_recipient_lastname, delivery_recipient_cedula
  )
  values (
    p_customer_name, p_customer_contact, p_payment_method_id, p_payment_screenshot_url, p_notes, 'pending', 'online',
    p_delivery_method, p_delivery_address, p_delivery_courier,
    p_delivery_recipient_name, p_delivery_recipient_lastname, p_delivery_recipient_cedula
  )
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
