-- Preserve the real login history already known by Supabase Auth so the
-- directory does not keep reporting active members as never seen.
update public.profiles as profile
set last_seen_at = case
  when profile.last_seen_at is null then auth_user.last_sign_in_at
  when auth_user.last_sign_in_at is null then profile.last_seen_at
  else greatest(profile.last_seen_at, auth_user.last_sign_in_at)
end
from auth.users as auth_user
where profile.id = auth_user.id
  and auth_user.last_sign_in_at is not null
  and (
    profile.last_seen_at is null
    or auth_user.last_sign_in_at > profile.last_seen_at
  );
