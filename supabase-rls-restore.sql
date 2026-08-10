-- ── Restaurar lectura pública tras activar RLS sin políticas ──────────
--
-- Corre esto en el SQL Editor de Supabase AHORA MISMO. Sin políticas, RLS
-- activado bloquea TODO acceso por defecto — por eso Mi LUMO, el seguimiento
-- de pedido y varias páginas del admin dejaron de cargar datos.
--
-- Ninguna escritura (insert/update/delete) del sistema usa la clave anónima:
-- todas pasan por rutas /api/* que usan SUPABASE_SERVICE_ROLE_KEY, la cual
-- siempre ignora RLS. Por eso este script SOLO agrega políticas de lectura
-- (SELECT) — deja insert/update/delete bloqueados para la clave anónima,
-- que es exactamente el comportamiento actual y deseado.
--
-- IMPORTANTE — esto no cierra la fuga de privacidad que motivó activar RLS:
-- restaura el mismo nivel de acceso de lectura que existía ANTES de hoy
-- (cualquiera con la clave anónima, que es pública, puede leer estas tablas
-- completas). Arreglar eso de verdad requiere mover las lecturas de Mi LUMO
-- (balance, pedidos, datos del cliente) detrás de una ruta de servidor que
-- valide la sesión primero — es un cambio de arquitectura real, fuera del
-- alcance de "correcciones pequeñas". Con este script la app vuelve a
-- funcionar en el mismo nivel de riesgo que tenía ayer, ni mejor ni peor.

create policy if not exists "Lectura pública" on clientes for select using (true);
create policy if not exists "Lectura pública" on pedidos for select using (true);
create policy if not exists "Lectura pública" on formulas for select using (true);
create policy if not exists "Lectura pública" on recetas for select using (true);
create policy if not exists "Lectura pública" on ingredientes for select using (true);
create policy if not exists "Lectura pública" on movimientos_balance for select using (true);
create policy if not exists "Lectura pública" on ajustes_pedido for select using (true);
create policy if not exists "Lectura pública" on feedback for select using (true);
create policy if not exists "Lectura pública" on configuracion for select using (true);
