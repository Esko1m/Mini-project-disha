// Supabase Edge Function: fingerprint-locate (proxy to ML service)
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
    const mlUrl = Deno.env.get("ML_SERVICE_URL");
    if (!mlUrl) {
      return new Response(
        JSON.stringify({ error: "ML_SERVICE_URL is not configured" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 503,
        }
      );
    }

    const body = await req.json();
    const res = await fetch(`${mlUrl}/locate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
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
