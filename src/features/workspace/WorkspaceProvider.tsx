import type { ReactNode } from "react";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { supabase } from "../../lib/supabase";
import { useAuth } from "../auth/AuthProvider";

type Profile = {
  id: string;
  full_name: string | null;
  avatar_url?: string | null;
  created_at?: string;
  updated_at?: string;
};

type Organization = {
  id: string;
  name: string;
  slug: string | null;
  created_at?: string;
  updated_at?: string;
};

type MembershipRole = "owner" | "admin" | "manager" | "member";

type Membership = {
  id: string;
  organization_id: string;
  user_id: string;
  role: MembershipRole;
  created_at?: string;
  updated_at?: string;
};

type WorkspaceContextValue = {
  loading: boolean;
  error: string | null;
  profile: Profile | null;
  organization: Organization | null;
  membership: Membership | null;
  role: MembershipRole | null;
  refreshWorkspace: () => Promise<void>;
};

const WorkspaceContext = createContext<WorkspaceContextValue | undefined>(
  undefined
);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { session, user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [membership, setMembership] = useState<Membership | null>(null);

  async function loadWorkspace() {
    if (!session || !user) {
      setProfile(null);
      setOrganization(null);
      setMembership(null);
      setError(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        throw profileError;
      }

      const { data: membershipData, error: membershipError } = await supabase
        .from("organization_members")
        .select("*")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();

      if (membershipError) {
        throw membershipError;
      }

      let organizationData: Organization | null = null;

      if (membershipData?.organization_id) {
        const { data: orgData, error: organizationError } = await supabase
          .from("organizations")
          .select("*")
          .eq("id", membershipData.organization_id)
          .maybeSingle();

        if (organizationError) {
          throw organizationError;
        }

        organizationData = orgData;
      }

      setProfile(profileData);
      setMembership(membershipData);
      setOrganization(organizationData);
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to load workspace.";

      setError(message);
      setProfile(null);
      setOrganization(null);
      setMembership(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadWorkspace();
  }, [session?.access_token, user?.id]);

  const value = useMemo<WorkspaceContextValue>(
    () => ({
      loading,
      error,
      profile,
      organization,
      membership,
      role: membership?.role ?? null,
      refreshWorkspace: loadWorkspace,
    }),
    [loading, error, profile, organization, membership]
  );

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);

  if (!context) {
    throw new Error("useWorkspace must be used inside WorkspaceProvider.");
  }

  return context;
}
