-- Single table storing all user progress blobs per feature
create table if not exists public.user_data (
  id          uuid        default gen_random_uuid() primary key,
  user_id     uuid        references auth.users(id) on delete cascade not null,
  feature     text        not null,
  data        jsonb       not null default '{}',
  updated_at  timestamptz default now() not null,
  constraint user_data_user_feature_unique unique (user_id, feature)
);

-- Row Level Security: users can only touch their own rows
alter table public.user_data enable row level security;

create policy "select own data"  on public.user_data for select  using (auth.uid() = user_id);
create policy "insert own data"  on public.user_data for insert  with check (auth.uid() = user_id);
create policy "update own data"  on public.user_data for update  using (auth.uid() = user_id);
create policy "delete own data"  on public.user_data for delete  using (auth.uid() = user_id);

-- Auto-update updated_at on every write
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger user_data_updated_at
  before update on public.user_data
  for each row execute procedure public.handle_updated_at();
