// Supabase Edge Function: building-map
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const url = new URL(req.url);
    const parts = url.pathname.split("/").filter(Boolean);
    const functionIndex = parts.lastIndexOf("building-map");
    const pathId =
      functionIndex >= 0 && parts[functionIndex + 1]
        ? parts[functionIndex + 1]
        : parts[parts.length - 1];

    let buildingId = url.searchParams.get("building_id") || pathId;

    if (req.method === "POST") {
      try {
        const body = await req.json();
        buildingId = body?.building_id || buildingId;
      } catch {
        // No JSON body.
      }
    }

    if (!buildingId || buildingId === "building-map") {
      return new Response(
        JSON.stringify({ error: "building_id is required" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    const [building, floors, nodes, edges, pois] = await Promise.all([
      supabase.from("buildings").select("*").eq("id", buildingId).maybeSingle(),
      supabase.from("floors").select("*").eq("building_id", buildingId),
      supabase.from("navigation_nodes").select("*").eq("building_id", buildingId),
      supabase.from("navigation_edges").select("*").eq("building_id", buildingId),
      supabase.from("points_of_interest").select("*").eq("building_id", buildingId),
    ]);

    if (building.error) throw building.error;
    if (!building.data) {
      return new Response(JSON.stringify({ error: "Building not found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404,
      });
    }

    return new Response(
      JSON.stringify({
        building: building.data,
        floors: floors.data || [],
        nodes: nodes.data || [],
        edges: edges.data || [],
        pois: pois.data || [],
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
