import { supabase } from "@/api/supabaseClient";

function origin() {
  return typeof window !== "undefined" ? window.location.origin : "";
}

export function mapAuthUser(sessionUser, profile) {
  if (!sessionUser) return null;
  return {
    id: sessionUser.id,
    email: sessionUser.email || profile?.email || "",
    full_name:
      profile?.full_name ||
      sessionUser.user_metadata?.full_name ||
      sessionUser.user_metadata?.name ||
      "",
    role: profile?.role || sessionUser.user_metadata?.role || "user",
  };
}

export async function me() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    const err = new Error("Not authenticated");
    err.status = 401;
    throw err;
  }
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, full_name, role")
    .eq("id", user.id)
    .maybeSingle();
  return mapAuthUser(user, profile);
}

export async function loginViaEmailPassword(email, password) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

export async function register({ email, password }) {
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${origin()}/login` },
  });
  if (error) throw error;
}

export async function verifyOtp({ email, otpCode }) {
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token: otpCode,
    type: "signup",
  });
  if (error) throw error;
  return data;
}

export async function resendOtp(email) {
  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: { emailRedirectTo: `${origin()}/login` },
  });
  if (error) throw error;
}

export async function loginWithProvider(provider, returnTo = "/") {
  const path = returnTo && returnTo.startsWith("/") ? returnTo : "/";
  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: `${origin()}${path}` },
  });
  if (error) throw error;
}

export async function resetPasswordRequest(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin()}/reset-password`,
  });
  if (error) throw error;
}

export async function resetPassword({ newPassword }) {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
}

export async function logout() {
  await supabase.auth.signOut();
}

export async function updateMe(patch) {
  const current = await me();
  const { error } = await supabase.from("profiles").update(patch).eq("id", current.id);
  if (error) throw error;
  return me();
}

export async function inviteUser(email, role = "user") {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
      data: { role },
      emailRedirectTo: `${origin()}/login`,
    },
  });
  if (error) throw error;
}

/** Send a fresh magic-link email (lost invite, new device, deleted inbox). */
export async function resendInvite(email, role = "user") {
  return inviteUser(email, role);
}
