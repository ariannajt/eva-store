-- ----------------------------------------------------------------------------
-- Productos "Próximamente": visibles en una sección aparte del catálogo,
-- pero todavía no se pueden comprar (sin precio de venta activo).
-- ----------------------------------------------------------------------------

alter table products add column coming_soon boolean not null default false;
