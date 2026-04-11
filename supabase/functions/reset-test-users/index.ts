import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const testUsers = [
  { email: "admin@vendorpro.com", password: "admin123", name: "Admin User", role: "admin" },
  { email: "vendor@vendorpro.com", password: "vendor123", name: "Vendor User", role: "vendor" },
  { email: "ops@vendorpro.com", password: "ops123", name: "Operations User", role: "operations" },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const results = [];

  for (const u of testUsers) {
    // Find and delete existing user
    const { data: existing } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existing?.users?.find(usr => usr.email === u.email);

    if (existingUser) {
      // Delete all their data first
      const userId = existingUser.id;
      const { data: orders } = await supabaseAdmin.from('orders').select('id').eq('vendor_id', userId);
      if (orders && orders.length > 0) {
        await supabaseAdmin.from('order_items').delete().in('order_id', orders.map(o => o.id));
      }
      await supabaseAdmin.from('returns').delete().eq('vendor_id', userId);
      await supabaseAdmin.from('settlements').delete().eq('vendor_id', userId);
      await supabaseAdmin.from('orders').delete().eq('vendor_id', userId);
      await supabaseAdmin.from('inventory').delete().eq('vendor_id', userId);
      await supabaseAdmin.from('products').delete().eq('vendor_id', userId);
      await supabaseAdmin.from('profiles').delete().eq('id', userId);
      await supabaseAdmin.from('user_roles').delete().eq('user_id', userId);
      await supabaseAdmin.auth.admin.deleteUser(userId);
    }

    // Recreate
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,
      user_metadata: { name: u.name },
    });

    if (authError) {
      results.push({ email: u.email, status: "error", message: authError.message });
      continue;
    }

    const userId = authData.user.id;
    if (u.role !== "vendor") {
      await supabaseAdmin.from("user_roles").update({ role: u.role }).eq("user_id", userId);
    }

    results.push({ email: u.email, role: u.role, status: "reset" });
  }

  return new Response(JSON.stringify({ results }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
