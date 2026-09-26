-- Apply after 001; records security actions without exposing internal notes to guests.
create table public.staff_audit_events(
 id uuid primary key default gen_random_uuid(),
 actor_id uuid not null references auth.users(id),
 action text not null check(action in ('revoke_order_access')),
 order_id uuid not null references public.orders(id),
 created_at timestamptz not null default now()
);
create index staff_audit_order_idx on public.staff_audit_events(order_id,created_at);
alter table public.staff_audit_events enable row level security;
revoke all on public.staff_audit_events from anon,authenticated;
grant all on public.staff_audit_events to service_role;

create function public.guard_online_production() returns trigger language plpgsql as $$ begin
 if new.fulfillment_status<>old.fulfillment_status and new.fulfillment_status not in ('novo','cancelado') and new.payment_method='online' and new.payment_status<>'approved' then
  raise exception 'Pagamento online ainda não aprovado';
 end if;
 return new;
end $$;
create trigger orders_payment_guard before update on public.orders for each row execute function public.guard_online_production();

-- Customer history must never expose staff-only notes or staff identities.
revoke select on public.order_status_events from authenticated;
grant select(id,order_id,status,created_at) on public.order_status_events to authenticated;
