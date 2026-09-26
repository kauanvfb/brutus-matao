-- Apply after 002; preserves instructions for each individual item.
alter table public.order_items
 add column if not exists notes text check(notes is null or length(notes)<=180);
