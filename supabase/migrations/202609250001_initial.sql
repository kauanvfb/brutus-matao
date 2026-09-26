-- Execute once in a new Supabase project; all prices are integer BRL cents.
create extension if not exists pgcrypto;
create table public.categories (id uuid primary key default gen_random_uuid(), name text not null check(length(name) between 2 and 90), slug text not null unique, description text, sort_order integer not null default 0, active boolean not null default true, approved boolean not null default false, created_at timestamptz not null default now());
create table public.products (id uuid primary key default gen_random_uuid(), category_id uuid not null references public.categories(id), name text not null check(length(name) between 2 and 120), slug text not null unique, description text not null default '', price_cents integer not null check(price_cents>=0), featured boolean not null default false, active boolean not null default true, approved boolean not null default false, available boolean not null default true, show_when_unavailable boolean not null default true, sort_order integer not null default 0, max_per_order integer check(max_per_order between 1 and 20), created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create index products_display_idx on public.products(category_id,sort_order) where active and approved;
create table public.product_images(id uuid primary key default gen_random_uuid(),product_id uuid not null references public.products(id),url text not null check(url ~ '^https://'),alt text not null,approved boolean not null default false,sort_order integer not null default 0,created_at timestamptz not null default now());
create table public.option_groups(id uuid primary key default gen_random_uuid(),title text not null,min_select integer not null default 0,max_select integer not null default 1,active boolean not null default true,sort_order integer not null default 0,check(min_select>=0 and max_select between 1 and 20 and min_select<=max_select));
create table public.option_choices(id uuid primary key default gen_random_uuid(),group_id uuid not null references public.option_groups(id),label text not null,price_cents integer not null default 0 check(price_cents>=0),active boolean not null default true,sort_order integer not null default 0);
create table public.product_option_groups(product_id uuid not null references public.products(id),group_id uuid not null references public.option_groups(id),sort_order integer not null default 0,primary key(product_id,group_id));
create table public.site_settings(key text primary key check(key in ('headline','intro','instagram','address','phone','hero_image','logo_url','orders_open','pickup_enabled','delivery_enabled','online_payment_enabled','offline_payment_enabled','notice')),value jsonb not null,updated_at timestamptz not null default now());
insert into public.site_settings(key,value) values ('headline','"A fome pede Brutus."'),('intro','"Hamburgueria em Matão, São Paulo. Explore o cardápio quando os produtos forem publicados pela equipe."'),('instagram','"https://www.instagram.com/brutusmatao/"'),('address','null'),('phone','null'),('hero_image','null'),('logo_url','null'),('orders_open','false'),('pickup_enabled','false'),('delivery_enabled','false'),('online_payment_enabled','false'),('offline_payment_enabled','false'),('notice','null');
create table public.gallery_media(id uuid primary key default gen_random_uuid(),url text not null check(url ~ '^https://'),caption text not null,approved boolean not null default false,sort_order integer not null default 0);
create table public.testimonials(id uuid primary key default gen_random_uuid(),author text not null,quote text not null,source text not null,date date not null,approved boolean not null default false);
create table public.opening_hours(day_of_week integer primary key check(day_of_week between 0 and 6),opens_at time not null,closes_at time not null,enabled boolean not null default false,check(opens_at<closes_at));
create table public.opening_exceptions(day date primary key,open boolean not null,opens_at time,closes_at time,reason text,check(not open or (opens_at is not null and closes_at is not null and opens_at<closes_at)));
create table public.service_modes(mode text primary key check(mode in ('pickup','delivery')),enabled boolean not null default false,minimum_cents integer not null default 0 check(minimum_cents>=0));
insert into public.service_modes(mode) values('pickup'),('delivery');
create table public.delivery_areas(id uuid primary key default gen_random_uuid(),label text not null,zip_start integer not null check(zip_start between 1000000 and 99999999),zip_end integer not null check(zip_end between 1000000 and 99999999),fee_cents integer not null check(fee_cents>=0),active boolean not null default false,check(zip_start<=zip_end));
create index delivery_zip_idx on public.delivery_areas(zip_start,zip_end) where active;
create table public.profiles(user_id uuid primary key references auth.users(id) on delete cascade,name text,created_at timestamptz not null default now());
create table public.staff_members(user_id uuid primary key references auth.users(id) on delete cascade,role text not null check(role in ('admin','operator')),active boolean not null default true,created_at timestamptz not null default now());
-- Assign staff with SQL from a trusted administrator only; never via client signup.
create table public.orders(id uuid primary key default gen_random_uuid(),reference text not null unique,idempotency_key uuid not null unique,request_hash text not null,customer_id uuid references auth.users(id),customer_name text not null,customer_phone text not null,customer_email text,fulfillment_method text not null check(fulfillment_method in ('pickup','delivery')),fulfillment_status text not null default 'novo' check(fulfillment_status in ('novo','confirmado','em_preparo','pronto_para_retirada','saiu_para_entrega','concluido','cancelado')),payment_method text not null check(payment_method in ('online','offline')),payment_status text not null default 'pending' check(payment_status in ('pending','approved','rejected','cancelled','refunded')),delivery_address jsonb,delivery_area_id uuid references public.delivery_areas(id),notes text,subtotal_cents integer not null check(subtotal_cents>=0),delivery_fee_cents integer not null default 0 check(delivery_fee_cents>=0),discount_cents integer not null default 0 check(discount_cents>=0),total_cents integer not null check(total_cents>=0 and total_cents=subtotal_cents+delivery_fee_cents-discount_cents),currency text not null default 'BRL' check(currency='BRL'),created_at timestamptz not null default now(),updated_at timestamptz not null default now(),check((fulfillment_method='delivery')=(delivery_address is not null)));
create index orders_status_time_idx on public.orders(fulfillment_status,created_at desc);
create index orders_customer_time_idx on public.orders(customer_id,created_at desc);
create table public.order_items(id uuid primary key default gen_random_uuid(),order_id uuid not null references public.orders(id),product_id uuid references public.products(id) on delete set null,product_name text not null,quantity integer not null check(quantity between 1 and 20),base_cents integer not null check(base_cents>=0),choices_snapshot jsonb not null default '[]'::jsonb check(jsonb_typeof(choices_snapshot)='array'),unit_cents integer not null check(unit_cents>=0),line_cents integer not null check(line_cents=unit_cents*quantity));
create index order_items_order_idx on public.order_items(order_id);
create table public.order_status_events(id uuid primary key default gen_random_uuid(),order_id uuid not null references public.orders(id),status text not null,actor_id uuid references auth.users(id),internal_note text,created_at timestamptz not null default now());
create index order_events_idx on public.order_status_events(order_id,created_at);
create table public.payments(id uuid primary key default gen_random_uuid(),order_id uuid not null references public.orders(id),provider text not null check(provider in ('mercadopago','offline')),provider_order_id text unique,status text not null default 'pending',amount_cents integer not null check(amount_cents>=0),currency text not null default 'BRL' check(currency='BRL'),checkout_url text,provider_idempotency_key uuid not null unique,created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create unique index payments_one_active_per_order on public.payments(order_id);
create table public.payment_events(id uuid primary key default gen_random_uuid(),payment_id uuid not null references public.payments(id),provider_event_id text not null unique,provider_status text not null,actor_id uuid references auth.users(id),received_at timestamptz not null default now());
create index payment_events_payment_idx on public.payment_events(payment_id,received_at desc);
create table public.order_access_tokens(order_id uuid primary key references public.orders(id),token_hash text not null unique,expires_at timestamptz not null,revoked_at timestamptz,created_at timestamptz not null default now());

-- Operational transitions are guarded in the database even if a route has a bug.
create function public.validate_order_transition() returns trigger language plpgsql as $$ begin
 if old.fulfillment_status<>new.fulfillment_status then
  if not ((old.fulfillment_status='novo' and new.fulfillment_status in ('confirmado','cancelado')) or (old.fulfillment_status='confirmado' and new.fulfillment_status in ('em_preparo','cancelado')) or (old.fulfillment_status='em_preparo' and new.fulfillment_status in ('pronto_para_retirada','saiu_para_entrega','cancelado')) or (old.fulfillment_status in ('pronto_para_retirada','saiu_para_entrega') and new.fulfillment_status='concluido')) then raise exception 'Transição de status inválida'; end if;
  if new.fulfillment_status='pronto_para_retirada' and new.fulfillment_method<>'pickup' then raise exception 'Status incompatível com a modalidade'; end if;
  if new.fulfillment_status='saiu_para_entrega' and new.fulfillment_method<>'delivery' then raise exception 'Status incompatível com a modalidade'; end if;
 end if;
 new.updated_at=now();return new;
end $$;
create trigger orders_transition before update on public.orders for each row execute function public.validate_order_transition();

-- A SECURITY DEFINER function reads staff without recursive RLS; no function writes privilege.
create function public.staff_role() returns text language sql stable security definer set search_path=public as $$ select role from public.staff_members where user_id=(select auth.uid()) and active limit 1 $$;
revoke all on function public.staff_role() from public;
grant execute on function public.staff_role() to authenticated;

-- Explicit grants: browsers cannot mutate order/payment/catalogue tables directly.
revoke all on all tables in schema public from anon,authenticated;
grant select on public.categories,public.products,public.product_images,public.option_groups,public.option_choices,public.product_option_groups,public.site_settings,public.gallery_media,public.testimonials,public.opening_hours,public.opening_exceptions,public.service_modes to anon,authenticated;
grant select on public.orders,public.order_items,public.order_status_events,public.profiles,public.staff_members to authenticated;

alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.option_groups enable row level security;
alter table public.option_choices enable row level security;
alter table public.product_option_groups enable row level security;
alter table public.site_settings enable row level security;
alter table public.gallery_media enable row level security;
alter table public.testimonials enable row level security;
alter table public.opening_hours enable row level security;
alter table public.opening_exceptions enable row level security;
alter table public.service_modes enable row level security;
alter table public.delivery_areas enable row level security;
alter table public.profiles enable row level security;
alter table public.staff_members enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_status_events enable row level security;
alter table public.payments enable row level security;
alter table public.payment_events enable row level security;
alter table public.order_access_tokens enable row level security;
create policy categories_public on public.categories for select to anon,authenticated using (active and approved);
create policy products_public on public.products for select to anon,authenticated using (active and approved and (available or show_when_unavailable) and exists(select 1 from public.categories c where c.id=category_id and c.active and c.approved));
create policy images_public on public.product_images for select to anon,authenticated using (approved and exists(select 1 from public.products p where p.id=product_id and p.active and p.approved));
create policy groups_public on public.option_groups for select to anon,authenticated using (active and exists(select 1 from public.product_option_groups pog join public.products p on p.id=pog.product_id where pog.group_id=public.option_groups.id and p.active and p.approved));
create policy choices_public on public.option_choices for select to anon,authenticated using (active and exists(select 1 from public.option_groups g join public.product_option_groups pog on pog.group_id=g.id join public.products p on p.id=pog.product_id join public.categories c on c.id=p.category_id where g.id=public.option_choices.group_id and g.active and p.active and p.approved and c.active and c.approved));
create policy product_groups_public on public.product_option_groups for select to anon,authenticated using (exists(select 1 from public.products p where p.id=product_id and p.active and p.approved));
create policy settings_public on public.site_settings for select to anon,authenticated using (true);
create policy gallery_public on public.gallery_media for select to anon,authenticated using (approved);
create policy testimonials_public on public.testimonials for select to anon,authenticated using (approved);
create policy hours_public on public.opening_hours for select to anon,authenticated using (true);
create policy exceptions_public on public.opening_exceptions for select to anon,authenticated using (true);
create policy modes_public on public.service_modes for select to anon,authenticated using (true);
create policy profiles_self on public.profiles for select to authenticated using (user_id=(select auth.uid()));
create policy staff_self on public.staff_members for select to authenticated using (user_id=(select auth.uid()));
create policy orders_self on public.orders for select to authenticated using (customer_id=(select auth.uid()));
create policy items_self on public.order_items for select to authenticated using (exists(select 1 from public.orders o where o.id=order_id and o.customer_id=(select auth.uid())));
create policy events_self on public.order_status_events for select to authenticated using (exists(select 1 from public.orders o where o.id=order_id and o.customer_id=(select auth.uid())));

-- Public bucket holds ONLY media manually approved/published by an admin. Private drafts stay outside it.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('brutus-public','brutus-public',true,10485760,array['image/jpeg','image/png','image/webp','image/avif']) on conflict (id) do nothing;
-- No INSERT/UPDATE/DELETE policies for anon/authenticated in storage.objects: server uploads after authorization.
