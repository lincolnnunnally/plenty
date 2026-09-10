-- Vidalia pantry shell only. No invented hours, people, donors, or inventory.
-- source='curated' so it is a real, editable org row — not fake neighbors.

insert into plenty_pantries (
  slug, name, city, state, zip, address, hours_text, about, phone, email,
  visit_style, status, source
)
select
  'vidalia',
  'Vidalia Plenty',
  'Vidalia',
  'GA',
  '30474',
  '',
  '',
  'Lincoln is establishing this pantry in Vidalia, Georgia. Hours, address, and what is on the shelves will be posted here once they are real — we will not invent them.',
  '',
  '',
  'walk_in',
  'setup',
  'curated'
where not exists (select 1 from plenty_pantries where slug = 'vidalia');
