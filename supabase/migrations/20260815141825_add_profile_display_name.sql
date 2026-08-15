alter table public.profiles
  add column if not exists display_name text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_display_name_length'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_display_name_length
      check (display_name is null or char_length(btrim(display_name)) between 1 and 40);
  end if;
end
$$;
