-- ----------------------------------------------------------------------------
-- Dueño del producto: para saber si la mercancía es de Ari o de Daniel.
-- ----------------------------------------------------------------------------

alter table products add column owner text check (owner in ('ari', 'daniel'));
