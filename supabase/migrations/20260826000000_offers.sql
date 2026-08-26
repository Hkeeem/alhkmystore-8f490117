create table public.offers (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  store_name text,
  old_price numeric,
  new_price numeric,
  discount_percent int,
  image_url text,
  affiliate_link text,
  is_hot boolean default false,
  created_at timestamp default now()
);
