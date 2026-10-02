-- Delivery fees are now configured per city instead of postal-code ranges.
-- Legacy ZIP columns are kept nullable so existing order references/area IDs remain valid.
alter table public.delivery_areas add column if not exists city text;
alter table public.delivery_areas add column if not exists city_key text;
alter table public.delivery_areas add column if not exists state text not null default 'SP';
alter table public.delivery_areas alter column zip_start drop not null;
alter table public.delivery_areas alter column zip_end drop not null;
drop index if exists public.delivery_zip_idx;
create index if not exists delivery_city_idx on public.delivery_areas(state,city_key) where active and city_key is not null;
create unique index if not exists delivery_city_unique_idx on public.delivery_areas(state,city_key) where city_key is not null;

-- Keep all seven weekdays permanently available in the admin. Closing a day is done with enabled=false.
insert into public.opening_hours(day_of_week,opens_at,closes_at,enabled) values
 (0,'18:00','23:00',false),
 (1,'18:00','23:00',false),
 (2,'18:00','23:00',false),
 (3,'18:00','23:00',false),
 (4,'18:00','23:00',false),
 (5,'18:00','23:00',false),
 (6,'18:00','23:00',false)
on conflict(day_of_week) do nothing;
