-- FICTITIOUS DEVELOPMENT DATA. Never run against the Brutus production project.
-- Run only in an isolated test Supabase project after explicitly setting:
--   SET app.brutus_environment = 'development';
do $$ begin if current_setting('app.brutus_environment', true) is distinct from 'development' then raise exception 'Development seed blocked: use an isolated test project and opt in'; end if; end $$;
insert into public.categories(id,name,slug,description,approved) values('aaaaaaaa-0000-4000-8000-000000000001','DEMO • Lanches','demo-lanches','Conteúdo fictício para testar fluxo',false) on conflict(id) do nothing;
insert into public.products(id,category_id,name,slug,description,price_cents,active,approved,available,featured) values('aaaaaaaa-0000-4000-8000-000000000002','aaaaaaaa-0000-4000-8000-000000000001','DEMO • Lanche de teste','demo-lanche-de-teste','Produto fictício de desenvolvimento. Não representa o cardápio da Brutus.',2990,true,false,true,false) on conflict(id) do nothing;
insert into public.option_groups(id,title,min_select,max_select) values('aaaaaaaa-0000-4000-8000-000000000003','DEMO • Escolha obrigatória',1,1) on conflict(id) do nothing;
insert into public.option_choices(id,group_id,label,price_cents) values('aaaaaaaa-0000-4000-8000-000000000004','aaaaaaaa-0000-4000-8000-000000000003','DEMO • Opção teste',300) on conflict(id) do nothing;
insert into public.product_option_groups(product_id,group_id) values('aaaaaaaa-0000-4000-8000-000000000002','aaaaaaaa-0000-4000-8000-000000000003') on conflict do nothing;
-- Deliberately NOT approved; NOT open; payment methods disabled. To run end-to-end
-- tests, explicitly enable only in the isolated project and restore afterward.
