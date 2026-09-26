-- Cardápio atualizado por Kauan em 26/09/2026. Executar após as migrations.
-- Não ativa pedidos, entrega ou pagamento. Remove somente os combos descontinuados.
BEGIN;
DELETE FROM product_option_groups WHERE product_id IN (
  'd79629eb-18ed-5ccf-a048-d777e1a99f84',
  'ff5e7204-36b6-5eb1-81cc-d14cd685cc17',
  '1354a402-9b03-59ce-854e-ed3a84635a0b'
);
DELETE FROM option_choices WHERE group_id IN (
  '7dffb11c-7221-59d2-bcbe-dd693f6bb1ec',
  'a134104c-3215-57f1-82ab-e274268fdc10',
  'd84b3996-a60c-5d8a-988f-4c7ebf1fcb50',
  'b0d34cec-8aaa-51ca-bca8-4e55a069318e',
  '3caf27c5-5036-5433-9701-c42e23c0a55f',
  '13f253df-075e-5b9e-93e0-fc4eb7488cbf',
  'ff6ce9c8-a709-5183-9540-6bd9e239e692'
);
DELETE FROM option_groups WHERE id IN (
  '7dffb11c-7221-59d2-bcbe-dd693f6bb1ec',
  'a134104c-3215-57f1-82ab-e274268fdc10',
  'd84b3996-a60c-5d8a-988f-4c7ebf1fcb50',
  'b0d34cec-8aaa-51ca-bca8-4e55a069318e',
  '3caf27c5-5036-5433-9701-c42e23c0a55f',
  '13f253df-075e-5b9e-93e0-fc4eb7488cbf',
  'ff6ce9c8-a709-5183-9540-6bd9e239e692'
);
DELETE FROM product_images WHERE product_id IN (
  'd79629eb-18ed-5ccf-a048-d777e1a99f84',
  'ff5e7204-36b6-5eb1-81cc-d14cd685cc17',
  '1354a402-9b03-59ce-854e-ed3a84635a0b'
);
DELETE FROM products WHERE id IN (
  'd79629eb-18ed-5ccf-a048-d777e1a99f84',
  'ff5e7204-36b6-5eb1-81cc-d14cd685cc17',
  '1354a402-9b03-59ce-854e-ed3a84635a0b'
);
DELETE FROM categories WHERE slug='combos';
INSERT INTO site_settings(key,value) VALUES ('phone','"(16) 99316-5102"'::jsonb) ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value,updated_at=now();
INSERT INTO categories(id,name,slug,description,sort_order,approved) VALUES ('66b07f24-a0b1-5176-9040-1d90d9342c59','Lanches','lanches','Os lanches do cardápio Brutus.',0,true) ON CONFLICT DO NOTHING;
INSERT INTO products(id,category_id,name,slug,description,price_cents,featured,approved,sort_order,max_per_order) VALUES ('e9c55ece-3dc3-5bef-a59a-a02075d0e373',(select id from categories where slug='lanches'),'Brutus Junior','brutus-junior','Pão, blend de 140 g e tomate.',2400,false,true,0,20) ON CONFLICT DO NOTHING;
INSERT INTO products(id,category_id,name,slug,description,price_cents,featured,approved,sort_order,max_per_order) VALUES ('5a7f7477-1e48-554b-8db0-0a987055f7a6',(select id from categories where slug='lanches'),'Blend Clássico','blend-classico','Pão de brioche, blend de 140 g, maionese verde, queijo cheddar fatiado, alface e tomate.',2800,true,true,1,20) ON CONFLICT DO NOTHING;
INSERT INTO products(id,category_id,name,slug,description,price_cents,featured,approved,sort_order,max_per_order) VALUES ('e3739e57-6c68-598d-90c6-b6805a07c5d3',(select id from categories where slug='lanches'),'Clássico Especial','classico-especial','Pão de brioche, blend de 140 g, queijo cheddar fatiado, maionese verde, bacon, cebola roxa, alface e tomate.',3600,false,true,2,20) ON CONFLICT DO NOTHING;
INSERT INTO products(id,category_id,name,slug,description,price_cents,featured,approved,sort_order,max_per_order) VALUES ('5bfe2a7f-15a3-5049-b0ba-53b354c0c614',(select id from categories where slug='lanches'),'Blend Turbo','blend-turbo','Pão de brioche, blend de 140 g, queijo cheddar fatiado, catupiry cremoso, bacon, alface e tomate.',3600,false,true,3,20) ON CONFLICT DO NOTHING;
INSERT INTO products(id,category_id,name,slug,description,price_cents,featured,approved,sort_order,max_per_order) VALUES ('8d04e57f-5785-57e8-8236-ae1c6901e75a',(select id from categories where slug='lanches'),'Cheddar Turbo','cheddar-turbo','Pão de brioche, blend de 140 g, cheddar cremoso, cheddar fatiado, bacon, alface e tomate.',3600,true,true,4,20) ON CONFLICT DO NOTHING;
INSERT INTO products(id,category_id,name,slug,description,price_cents,featured,approved,sort_order,max_per_order) VALUES ('3f49c700-c126-57be-8891-0c95d371d311',(select id from categories where slug='lanches'),'Brutus Furioso','brutus-furioso','Pão de brioche, blend de 140 g, pimenta jalapeño, queijo fatiado, bacon, alface, tomate e maionese verde.',3600,false,true,5,20) ON CONFLICT DO NOTHING;
INSERT INTO products(id,category_id,name,slug,description,price_cents,featured,approved,sort_order,max_per_order) VALUES ('fd19f2b5-19e7-5511-ba05-3adca49f7deb',(select id from categories where slug='lanches'),'Brutus Agridoce','brutus-agridoce','Pão de brioche, blend de 140 g, queijo fatiado, bacon caramelizado, cebola roxa, molho chipotle, alface e tomate.',3600,false,true,6,20) ON CONFLICT DO NOTHING;
INSERT INTO products(id,category_id,name,slug,description,price_cents,featured,approved,sort_order,max_per_order) VALUES ('40fe3a98-274a-502b-b073-46352789f63b',(select id from categories where slug='lanches'),'Big Brutus','big-brutus','Pão de brioche, 2 blends de 140 g, alface, queijo, molho Billy & Jack, cebola e picles.',3900,false,true,7,20) ON CONFLICT DO NOTHING;
INSERT INTO products(id,category_id,name,slug,description,price_cents,featured,approved,sort_order,max_per_order) VALUES ('2b3c5cac-d04b-5f4f-8c56-3002db93f66b',(select id from categories where slug='lanches'),'Brutus Brabo','brutus-brabo','Pão de brioche, 2 hambúrgueres de costela de 120 g, catupiry cremoso, queijo cheddar fatiado e bacon.',4200,false,true,8,20) ON CONFLICT DO NOTHING;
INSERT INTO products(id,category_id,name,slug,description,price_cents,featured,approved,sort_order,max_per_order) VALUES ('83a1b4a4-2bbd-558d-bb01-5fe6a08b4a2b',(select id from categories where slug='lanches'),'Brutus Supremo','brutus-supremo','Pão de brioche, 2 blends de 120 g, queijo cheddar fatiado e cremoso, bacon e cebola caramelizada.',4200,true,true,9,20) ON CONFLICT DO NOTHING;
INSERT INTO products(id,category_id,name,slug,description,price_cents,featured,approved,sort_order,max_per_order) VALUES ('e55483db-2073-5c36-ab16-54f68cdd5581',(select id from categories where slug='lanches'),'Blend Caramelizado','blend-caramelizado','1 blend de 140 g, cheddar fatiado e cremoso, cebola caramelizada, bacon, alface e tomate.',3800,false,true,10,20) ON CONFLICT DO NOTHING;
INSERT INTO products(id,category_id,name,slug,description,price_cents,featured,approved,sort_order,max_per_order) VALUES ('b710c152-3c4b-56a3-bf9b-60bb645a58c5',(select id from categories where slug='lanches'),'Blend Carnívoro','blend-carnivoro','Pão de brioche, 3 blends de 140 g, 3 cheddars fatiados, maionese verde e bacon.',5200,false,true,11,20) ON CONFLICT DO NOTHING;

-- Adicionais disponíveis em todos os lanches.
INSERT INTO option_groups(id,title,min_select,max_select,sort_order,active)
VALUES ('99ed29e5-ea9a-50dd-9992-6170500989d3','Adicionais',0,3,0,true)
ON CONFLICT (id) DO UPDATE SET title=EXCLUDED.title,min_select=EXCLUDED.min_select,max_select=EXCLUDED.max_select,active=true;
INSERT INTO option_choices(id,group_id,label,price_cents,sort_order,active) VALUES
 ('86a4c38b-cc0a-5384-aad7-3cd574ddf06a','99ed29e5-ea9a-50dd-9992-6170500989d3','Catupiry',500,0,true),
 ('5a1c5f13-6911-5064-9da0-83df6d8590c0','99ed29e5-ea9a-50dd-9992-6170500989d3','Cheddar',500,1,true),
 ('f0e55552-2c4e-5c15-b9df-3b5a97af0ce1','99ed29e5-ea9a-50dd-9992-6170500989d3','Bacon',500,2,true)
ON CONFLICT (id) DO UPDATE SET label=EXCLUDED.label,price_cents=EXCLUDED.price_cents,sort_order=EXCLUDED.sort_order,active=true;
INSERT INTO product_option_groups(product_id,group_id,sort_order)
SELECT id,'99ed29e5-ea9a-50dd-9992-6170500989d3',0 FROM products WHERE category_id=(SELECT id FROM categories WHERE slug='lanches')
ON CONFLICT (product_id,group_id) DO UPDATE SET sort_order=EXCLUDED.sort_order;

-- Porções transcritas da foto oficial enviada.
INSERT INTO categories(id,name,slug,description,sort_order,approved) VALUES
 ('803e555f-faf5-55a8-b631-5dfe3b8b24b3','Porções','porcoes','Porções para completar o pedido.',1,true),
 ('262947bb-2e7d-5e13-a037-505a8cdba1be','Bebidas','bebidas','Bebidas geladas para acompanhar.',2,true)
ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name,description=EXCLUDED.description,sort_order=EXCLUDED.sort_order,approved=true,active=true;
INSERT INTO products(id,category_id,name,slug,description,price_cents,featured,approved,sort_order,max_per_order,active,available) VALUES
 ('9be5c27a-e7b0-5dfe-8b84-f132f2b4e990','803e555f-faf5-55a8-b631-5dfe3b8b24b3','Batata frita palito','batata-frita-palito-150g','Porção de 150 g.',1200,false,true,0,20,true,true),
 ('c1112748-5a34-52b8-bb07-8ac43de2888d','803e555f-faf5-55a8-b631-5dfe3b8b24b3','Batata McCain Smile','batata-mccain-smile-5','Porção com 5 unidades.',1200,false,true,1,20,true,true),
 ('6998eba6-7a6d-51ad-aa4a-565464055029','803e555f-faf5-55a8-b631-5dfe3b8b24b3','Batata belga','batata-belga','Porção de batata belga.',3000,false,true,2,20,true,true),
 ('876815e3-4b42-5526-a6db-a30ad40a6fad','803e555f-faf5-55a8-b631-5dfe3b8b24b3','Batata McCain Smile','batata-mccain-smile-15','Porção com 15 unidades.',3000,false,true,3,20,true,true),
 ('55463054-9f18-5b94-bbe8-85dcce6a2af1','262947bb-2e7d-5e13-a037-505a8cdba1be','Água sem gás','agua-sem-gas','Garrafa de água mineral sem gás.',300,false,true,0,20,true,true),
 ('ffb93e22-9799-5753-9573-11a1a0082818','262947bb-2e7d-5e13-a037-505a8cdba1be','Suco','suco','Os sabores serão acrescentados em breve.',600,false,true,1,20,true,true),
 ('55c565e8-c166-5e06-8096-f0a44eca3978','262947bb-2e7d-5e13-a037-505a8cdba1be','Refrigerante lata','refrigerante-lata','Escolha entre as opções tradicionais e zero.',600,false,true,2,20,true,true),
 ('1812f0c0-55a6-5f6f-a668-73627b725b6b','262947bb-2e7d-5e13-a037-505a8cdba1be','Refrigerante 2 L','refrigerante-2l','Garrafa de 2 litros; escolha entre tradicional e zero.',1400,false,true,3,20,true,true)
ON CONFLICT (id) DO UPDATE SET category_id=EXCLUDED.category_id,name=EXCLUDED.name,slug=EXCLUDED.slug,description=EXCLUDED.description,price_cents=EXCLUDED.price_cents,sort_order=EXCLUDED.sort_order,max_per_order=EXCLUDED.max_per_order,approved=true,active=true,available=true;

-- Sabores padrão de refrigerante em versão tradicional e zero.
INSERT INTO option_groups(id,title,min_select,max_select,sort_order,active) VALUES
 ('3fc35597-1f2b-57fe-ad72-ba997dfa341f','Escolha o refrigerante',1,1,0,true),
 ('2fd9e1be-ea67-56b5-b3cd-72747d791eaa','Escolha o refrigerante',1,1,0,true)
ON CONFLICT (id) DO UPDATE SET title=EXCLUDED.title,min_select=1,max_select=1,active=true;
INSERT INTO option_choices(id,group_id,label,price_cents,sort_order,active) VALUES
 ('030a7f45-e993-5a2a-bb80-47df4ff5ed43','3fc35597-1f2b-57fe-ad72-ba997dfa341f','Coca-Cola',0,0,true),
 ('817c587d-659a-5e38-ae81-e5b2b913c7cd','3fc35597-1f2b-57fe-ad72-ba997dfa341f','Coca-Cola Zero',0,1,true),
 ('101c369a-013c-5e8b-945c-3448c4b683de','3fc35597-1f2b-57fe-ad72-ba997dfa341f','Guaraná Antarctica',0,2,true),
 ('dfb4012e-ecbf-5816-81d9-ef0993566ceb','3fc35597-1f2b-57fe-ad72-ba997dfa341f','Guaraná Antarctica Zero',0,3,true),
 ('ebaa4dfb-2df8-562d-a988-319e344e0e9d','3fc35597-1f2b-57fe-ad72-ba997dfa341f','Fanta Laranja',0,4,true),
 ('6cbac298-7b23-566c-a6fe-ca35d2a3e136','3fc35597-1f2b-57fe-ad72-ba997dfa341f','Fanta Laranja Zero',0,5,true),
 ('f7b77527-05c6-54cf-bd5e-8cb0cdb5e475','3fc35597-1f2b-57fe-ad72-ba997dfa341f','Sprite',0,6,true),
 ('15734d3f-7ffc-53db-a6a1-6884bf309ca3','3fc35597-1f2b-57fe-ad72-ba997dfa341f','Sprite Zero',0,7,true),
 ('62fb51dd-5216-55fa-8794-6778161e063b','2fd9e1be-ea67-56b5-b3cd-72747d791eaa','Coca-Cola',0,0,true),
 ('d567d7ce-57d1-5d73-b41b-b18c15e14226','2fd9e1be-ea67-56b5-b3cd-72747d791eaa','Coca-Cola Zero',0,1,true),
 ('fff0bf1c-8648-50f3-b44b-b42b1e098b46','2fd9e1be-ea67-56b5-b3cd-72747d791eaa','Guaraná Antarctica',0,2,true),
 ('49c46fe2-847b-5d62-9ec0-de9c626df704','2fd9e1be-ea67-56b5-b3cd-72747d791eaa','Guaraná Antarctica Zero',0,3,true),
 ('806f0a74-a39e-5538-999b-784fd11308d1','2fd9e1be-ea67-56b5-b3cd-72747d791eaa','Fanta Laranja',0,4,true),
 ('628e4e4f-c0c5-56f8-b493-b60ebb160cd6','2fd9e1be-ea67-56b5-b3cd-72747d791eaa','Fanta Laranja Zero',0,5,true),
 ('b1e9aa13-0ec9-57fe-a80e-66591b6fce4f','2fd9e1be-ea67-56b5-b3cd-72747d791eaa','Sprite',0,6,true),
 ('1b85a4b1-242d-5969-84ef-6c01f1b2ecb2','2fd9e1be-ea67-56b5-b3cd-72747d791eaa','Sprite Zero',0,7,true)
ON CONFLICT (id) DO UPDATE SET label=EXCLUDED.label,price_cents=0,sort_order=EXCLUDED.sort_order,active=true;
INSERT INTO product_option_groups(product_id,group_id,sort_order) VALUES
 ('55c565e8-c166-5e06-8096-f0a44eca3978','3fc35597-1f2b-57fe-ad72-ba997dfa341f',0),
 ('1812f0c0-55a6-5f6f-a668-73627b725b6b','2fd9e1be-ea67-56b5-b3cd-72747d791eaa',0)
ON CONFLICT (product_id,group_id) DO UPDATE SET sort_order=EXCLUDED.sort_order;
COMMIT;
