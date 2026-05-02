alter table public.clients
add column if not exists source_lead_id uuid references public.leads(id) on delete set null;

alter table public.clients
add column if not exists converted_at timestamptz;

create unique index if not exists clients_source_lead_id_unique
on public.clients(source_lead_id)
where source_lead_id is not null;

create or replace function public.convert_lead_to_client(target_lead_id uuid)
returns public.clients
language plpgsql
security definer
set search_path = public
as $$
declare
  selected_lead public.leads%rowtype;
  existing_client public.clients%rowtype;
  created_client public.clients%rowtype;
  current_user_id uuid;
begin
  current_user_id := auth.uid();

  if current_user_id is null then
    raise exception 'User must be authenticated.';
  end if;

  select *
  into selected_lead
  from public.leads
  where id = target_lead_id;

  if selected_lead.id is null then
    raise exception 'Lead not found.';
  end if;

  if not public.is_org_member(selected_lead.organization_id) then
    raise exception 'You do not have access to this lead.';
  end if;

  select *
  into existing_client
  from public.clients
  where source_lead_id = target_lead_id
    and organization_id = selected_lead.organization_id
  limit 1;

  if existing_client.id is not null then
    update public.leads
    set status = 'won',
        updated_at = now()
    where id = selected_lead.id;

    return existing_client;
  end if;

  insert into public.clients (
    organization_id,
    name,
    contact_name,
    phone,
    email,
    website,
    industry,
    status,
    notes,
    source_lead_id,
    converted_at
  )
  values (
    selected_lead.organization_id,
    selected_lead.company_name,
    selected_lead.contact_name,
    selected_lead.phone,
    selected_lead.email,
    selected_lead.website,
    selected_lead.industry,
    'active',
    selected_lead.notes,
    selected_lead.id,
    now()
  )
  returning * into created_client;

  update public.leads
  set status = 'won',
      updated_at = now()
  where id = selected_lead.id;

  insert into public.activity_logs (
    organization_id,
    actor_id,
    action,
    entity_type,
    entity_id,
    metadata
  )
  values (
    selected_lead.organization_id,
    current_user_id,
    'lead.converted_to_client',
    'client',
    created_client.id,
    jsonb_build_object(
      'lead_id', selected_lead.id,
      'client_id', created_client.id,
      'company_name', selected_lead.company_name
    )
  );

  return created_client;
end;
$$;

grant execute on function public.convert_lead_to_client(uuid) to authenticated;
