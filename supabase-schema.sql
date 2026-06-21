-- Ingredientes base
create table if not exists ingredientes (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  unidad text not null default 'g',
  created_at timestamptz default now()
);

-- Fórmulas (Verde, Rojo, Tropical)
create table if not exists formulas (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  slug text unique not null,
  color_acento text not null default '#4A5E3A',
  activa boolean default true,
  created_at timestamptz default now()
);

-- Receta: qué lleva cada fórmula y en qué cantidad
create table if not exists recetas (
  id uuid primary key default gen_random_uuid(),
  formula_id uuid references formulas(id) on delete cascade,
  ingrediente_id uuid references ingredientes(id) on delete cascade,
  gramos numeric not null,
  updated_at timestamptz default now()
);

-- Clientes
create table if not exists clientes (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  telefono text,
  email text,
  notas text,
  activo boolean default true,
  created_at timestamptz default now()
);

-- Pedidos semanales
create table if not exists pedidos (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid references clientes(id) on delete set null,
  formula_id uuid references formulas(id) on delete set null,
  cantidad integer not null default 1,
  dia_entrega date not null,
  estado text not null default 'pendiente', -- pendiente | preparado | entregado
  notas text,
  created_at timestamptz default now()
);

-- Ajustes de pedido (solicitudes de cambio de fecha o crédito)
create table if not exists ajustes_pedido (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid references pedidos(id) on delete cascade not null,
  adjustment_type text not null check (adjustment_type in ('date_change', 'credit_request')),
  requested_date date,
  credit_validity_days int,
  status text not null default 'pending_review' check (status in ('pending_review', 'approved', 'rejected', 'superseded')),
  created_at timestamptz default now()
);

-- ── Datos iniciales ──────────────────────────────────────────

-- Ingredientes
insert into ingredientes (nombre, unidad) values
  ('Pepino', 'g'),
  ('Apio', 'g'),
  ('Manzana verde', 'g'),
  ('Limón', 'g'),
  ('Espinaca', 'g'),
  ('Jengibre', 'g'),
  ('Betabel', 'g'),
  ('Zanahoria', 'g'),
  ('Manzana roja', 'g'),
  ('Piña', 'g')
on conflict do nothing;

-- Fórmulas
insert into formulas (nombre, slug, color_acento) values
  ('Verde Fresco', 'verde', '#4A5E3A'),
  ('Rojo Vital', 'rojo', '#7A2030'),
  ('Tropical Hydrate', 'tropical', '#B8860B')
on conflict (slug) do nothing;

-- Recetas (gramos por botella de 250ml)
-- Verde: Pepino 120g, Apio 80g, Manzana verde 100g, Limón 30g, Espinaca 60g, Jengibre 15g
insert into recetas (formula_id, ingrediente_id, gramos)
select f.id, i.id,
  case i.nombre
    when 'Pepino' then 120
    when 'Apio' then 80
    when 'Manzana verde' then 100
    when 'Limón' then 30
    when 'Espinaca' then 60
    when 'Jengibre' then 15
  end
from formulas f, ingredientes i
where f.slug = 'verde'
  and i.nombre in ('Pepino','Apio','Manzana verde','Limón','Espinaca','Jengibre')
on conflict do nothing;

-- Rojo: Betabel 120g, Zanahoria 90g, Manzana roja 80g, Limón 25g, Jengibre 15g, Pepino 80g
insert into recetas (formula_id, ingrediente_id, gramos)
select f.id, i.id,
  case i.nombre
    when 'Betabel' then 120
    when 'Zanahoria' then 90
    when 'Manzana roja' then 80
    when 'Limón' then 25
    when 'Jengibre' then 15
    when 'Pepino' then 80
  end
from formulas f, ingredientes i
where f.slug = 'rojo'
  and i.nombre in ('Betabel','Zanahoria','Manzana roja','Limón','Jengibre','Pepino')
on conflict do nothing;

-- Tropical: Piña 150g, Pepino 80g, Limón 30g, Jengibre 15g
insert into recetas (formula_id, ingrediente_id, gramos)
select f.id, i.id,
  case i.nombre
    when 'Piña' then 150
    when 'Pepino' then 80
    when 'Limón' then 30
    when 'Jengibre' then 15
  end
from formulas f, ingredientes i
where f.slug = 'tropical'
  and i.nombre in ('Piña','Pepino','Limón','Jengibre')
on conflict do nothing;
