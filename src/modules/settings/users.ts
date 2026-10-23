import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AppRole } from "@/modules/access/roles";

export type ManagedUser = {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  role: AppRole;
  isActive: boolean;
  deactivationReason: string | null;
  invitedAt: string | null;
  lastSignInAt: string | null;
  branchIds: string[];
  status: "active" | "pending" | "inactive";
};

export async function listManagedUsers(): Promise<{ users: ManagedUser[]; error: boolean }> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("admin_list_users");
  if (error || !data) return { users: [], error: true };
  return {
    error: false,
    users: data.map((u) => ({
      id: u.id,
      email: u.email,
      fullName: u.full_name,
      phone: u.phone,
      role: u.role,
      isActive: u.is_active,
      deactivationReason: u.deactivation_reason,
      invitedAt: u.invited_at,
      lastSignInAt: u.last_sign_in_at,
      branchIds: u.branch_ids ?? [],
      status: !u.is_active ? "inactive" : u.last_sign_in_at ? "active" : "pending",
    })),
  };
}

export async function listBranchOptions() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("branches").select("id, name, is_active").order("name");
  return data ?? [];
}
