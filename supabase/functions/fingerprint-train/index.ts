// Supabase Edge Function: fingerprint-train (proxy to ML service)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { building_id } = await req.json();
    if (!building_id) {
      return new Response(JSON.stringify({ error: "building_id is required" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const mlUrl = Deno.env.get("ML_SERVICE_URL");
    if (!mlUrl) {
      return new Response(
        JSON.stringify({
          building_id,
          status: "ready",
          mode: "on-device",
          message: "Matching runs on-device; no server training required.",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    const res = await fetch(`${mlUrl}/train/${building_id}`, { method: "POST" });
    const data = await res.json();
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: res.status,
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
