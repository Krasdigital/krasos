-- Creates the initial workspace for a brand-new authenticated user.
-- This bypasses the "must already be an org member" problem during first signup.

create or replace function public.create_initial_workspace(
  full_name_input text,
  organization_name_input text
)
returns table (
  organization_id uuid,
  profile_id uuid,
  membership_id uuid
)
language plpgsql
security definer
set search_path = public
as $$
declare
  new_org_id uuid;
  new_membership_id uuid;
  current_user_id uuid;
begin
  current_user_id := auth.uid();

  if current_user_id is null then
    raise exception 'User must be authenticated.';
  end if;

  insert into public.profiles (
    id,
    full_name
  )
  values (
    current_user_id,
    nullif(trim(full_name_input), '')
  )
  on conflict (id)
  do update set
    full_name = excluded.full_name,
    updated_at = now();

  insert into public.organizations (
    name,
    slug
  )
  values (
    nullif(trim(organization_name_input), ''),
    lower(
      regexp_replace(
        nullif(trim(organization_name_input), ''),
        '[^a-zA-Z0-9]+',
        '-',
        'g'
      )
    ) || '-' || substr(current_user_id::text, 1, 8)
  )
  returning id into new_org_id;

  insert into public.organization_members (
    organization_id,
    user_id,
    role
  )
  values (
    new_org_id,
    current_user_id,
    'owner'
  )
  returning id into new_membership_id;

  insert into public.activity_logs (
    organization_id,
    actor_id,
    action,
    entity_type,
    entity_id,
    metadata
  )
  values (
    new_org_id,
    current_user_id,
    'workspace.created',
    'organization',
    new_org_id,
    jsonb_build_object(
      'source', 'onboarding',
      'role', 'owner'
    )
  );

  return query
  select
    new_org_id as organization_id,
    current_user_id as profile_id,
    new_membership_id as membership_id;
end;
$$;

grant execute on function public.create_initial_workspace(text, text) to authenticated;
