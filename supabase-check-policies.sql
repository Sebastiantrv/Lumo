-- Corre esto en el SQL Editor de Supabase y pégame el resultado completo.
-- Muestra, para cada tabla relevante, qué políticas existen, sobre qué
-- comando (SELECT/INSERT/UPDATE/DELETE), a qué rol aplican y bajo qué
-- condición (USING / WITH CHECK). Con esto sabemos si ya hay cobertura de
-- lectura o si de verdad falta.

select
  tablename,
  policyname,
  cmd as comando,
  roles,
  qual as condicion_using,
  with_check
from pg_policies
where schemaname = 'public'
  and tablename in (
    'clientes', 'pedidos', 'formulas', 'recetas', 'ingredientes',
    'movimientos_balance', 'ajustes_pedido', 'feedback', 'configuracion'
  )
order by tablename, cmd;
