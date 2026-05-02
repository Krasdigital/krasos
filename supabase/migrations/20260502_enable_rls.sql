-- Enable Row Level Security for core Kras OS tables

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.organization_members enable row level security;
alter table public.leads enable row level security;
alter table public.clients enable row level security;
alter table public.projects enable row level security;
alter table public.tasks enable row level security;
alter table public.notes enable row level security;
alter table public.activity_logs enable row level security;
alter table public.files enable row level security;

-- Helper function: checks if the current authenticated user belongs to an organization

create or replace function public.is_org_member(target_org_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_members om
    where om.organization_id = target_org_id
      and om.user_id = auth.uid()
  );
$$;

-- Helper function: checks if the current authenticated user has one of the allowed roles

create or replace function public.has_org_role(target_org_id uuid, allowed_roles text[])
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_members om
    where om.organization_id = target_org_id
      and om.user_id = auth.uid()
      and om.role = any(allowed_roles)
  );
$$;

-- Profiles policies

create policy "Users can view their own profile"
on public.profiles
for select
to authenticated
using (id = auth.uid());

create policy "Users can update their own profile"
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy "Users can insert their own profile"
on public.profiles
for insert
to authenticated
with check (id = auth.uid());

-- Organizations policies

create policy "Members can view their organizations"
on public.organizations
for select
to authenticated
using (public.is_org_member(id));

create policy "Owners can update their organizations"
on public.organizations
for update
to authenticated
using (public.has_org_role(id, array['owner', 'admin']))
with check (public.has_org_role(id, array['owner', 'admin']));

create policy "Authenticated users can create organizations"
on public.organizations
for insert
to authenticated
with check (true);

-- Organization members policies

create policy "Members can view organization memberships"
on public.organization_members
for select
to authenticated
using (public.is_org_member(organization_id));

create policy "Owners and admins can manage organization members"
on public.organization_members
for insert
to authenticated
with check (public.has_org_role(organization_id, array['owner', 'admin']));

create policy "Owners and admins can update organization members"
on public.organization_members
for update
to authenticated
using (public.has_org_role(organization_id, array['owner', 'admin']))
with check (public.has_org_role(organization_id, array['owner', 'admin']));

create policy "Owners and admins can delete organization members"
on public.organization_members
for delete
to authenticated
using (public.has_org_role(organization_id, array['owner', 'admin']));

-- Leads policies

create policy "Members can view leads in their organization"
on public.leads
for select
to authenticated
using (public.is_org_member(organization_id));

create policy "Members can create leads in their organization"
on public.leads
for insert
to authenticated
with check (public.is_org_member(organization_id));

create policy "Members can update leads in their organization"
on public.leads
for update
to authenticated
using (public.is_org_member(organization_id))
with check (public.is_org_member(organization_id));

create policy "Owners admins and managers can delete leads"
on public.leads
for delete
to authenticated
using (public.has_org_role(organization_id, array['owner', 'admin', 'manager']));

-- Clients policies

create policy "Members can view clients in their organization"
on public.clients
for select
to authenticated
using (public.is_org_member(organization_id));

create policy "Members can create clients in their organization"
on public.clients
for insert
to authenticated
with check (public.is_org_member(organization_id));

create policy "Members can update clients in their organization"
on public.clients
for update
to authenticated
using (public.is_org_member(organization_id))
with check (public.is_org_member(organization_id));

create policy "Owners admins and managers can delete clients"
on public.clients
for delete
to authenticated
using (public.has_org_role(organization_id, array['owner', 'admin', 'manager']));

-- Projects policies

create policy "Members can view projects in their organization"
on public.projects
for select
to authenticated
using (public.is_org_member(organization_id));

create policy "Members can create projects in their organization"
on public.projects
for insert
to authenticated
with check (public.is_org_member(organization_id));

create policy "Members can update projects in their organization"
on public.projects
for update
to authenticated
using (public.is_org_member(organization_id))
with check (public.is_org_member(organization_id));

create policy "Owners admins and managers can delete projects"
on public.projects
for delete
to authenticated
using (public.has_org_role(organization_id, array['owner', 'admin', 'manager']));

-- Tasks policies

create policy "Members can view tasks in their organization"
on public.tasks
for select
to authenticated
using (public.is_org_member(organization_id));

create policy "Members can create tasks in their organization"
on public.tasks
for insert
to authenticated
with check (public.is_org_member(organization_id));

create policy "Members can update tasks in their organization"
on public.tasks
for update
to authenticated
using (public.is_org_member(organization_id))
with check (public.is_org_member(organization_id));

create policy "Owners admins and managers can delete tasks"
on public.tasks
for delete
to authenticated
using (public.has_org_role(organization_id, array['owner', 'admin', 'manager']));

-- Notes policies

create policy "Members can view notes in their organization"
on public.notes
for select
to authenticated
using (public.is_org_member(organization_id));

create policy "Members can create notes in their organization"
on public.notes
for insert
to authenticated
with check (public.is_org_member(organization_id));

create policy "Members can update notes in their organization"
on public.notes
for update
to authenticated
using (public.is_org_member(organization_id))
with check (public.is_org_member(organization_id));

create policy "Owners admins and managers can delete notes"
on public.notes
for delete
to authenticated
using (public.has_org_role(organization_id, array['owner', 'admin', 'manager']));

-- Activity logs policies

create policy "Members can view activity logs in their organization"
on public.activity_logs
for select
to authenticated
using (public.is_org_member(organization_id));

create policy "Members can create activity logs in their organization"
on public.activity_logs
for insert
to authenticated
with check (public.is_org_member(organization_id));

-- Files policies

create policy "Members can view files in their organization"
on public.files
for select
to authenticated
using (public.is_org_member(organization_id));

create policy "Members can create files in their organization"
on public.files
for insert
to authenticated
with check (public.is_org_member(organization_id));

create policy "Members can update files in their organization"
on public.files
for update
to authenticated
using (public.is_org_member(organization_id))
with check (public.is_org_member(organization_id));

create policy "Owners admins and managers can delete files"
on public.files
for delete
to authenticated
using (public.has_org_role(organization_id, array['owner', 'admin', 'manager']));
