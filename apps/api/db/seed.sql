-- Default departments and routing (matches the reference site). Safe to run once.
insert into departments (name) values
  ('Public Works - Roads'), ('Sanitation'), ('Electrical'),
  ('Water Supply & Sewerage'), ('Traffic'), ('Parks')
on conflict (name) do nothing;

insert into routing_rules (category, department_id) values
  ('road',        (select id from departments where name = 'Public Works - Roads')),
  ('garbage',     (select id from departments where name = 'Sanitation')),
  ('streetlight', (select id from departments where name = 'Electrical')),
  ('water',       (select id from departments where name = 'Water Supply & Sewerage')),
  ('traffic',     (select id from departments where name = 'Traffic')),
  ('parks',       (select id from departments where name = 'Parks'))
on conflict (category) do nothing;
