// ============================================================================
// get-bcv-rate
// ----------------------------------------------------------------------------
// Trae la tasa oficial del Euro publicada por el BCV
// (bcv.org.ve/tasas-informativas-sistema-bancario), usada para mostrar el
// total en bolívares junto al total en dólares.
//
// El BCV no tiene una API pública propia, así que se consulta dolarapi.com,
// que replica la misma tasa oficial ("fuente": "oficial").
// ============================================================================
import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const res = await fetch("https://ve.dolarapi.com/v1/euros/oficial");
    if (!res.ok) {
      throw new Error(`dolarapi respondió con estado ${res.status}`);
    }

    const data = await res.json();
    if (!data.promedio) {
      throw new Error("La respuesta no trajo la tasa");
    }

    return new Response(
      JSON.stringify({ rate: data.promedio, updatedAt: data.fechaActualizacion }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: `No se pudo obtener la tasa BCV: ${(err as Error).message}` }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
