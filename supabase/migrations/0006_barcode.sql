-- ----------------------------------------------------------------------------
-- Código de barras: permite escanear un producto (crear/editar) y luego
-- venderlo escaneándolo desde el panel de admin.
-- ----------------------------------------------------------------------------

alter table products add column barcode text unique;
