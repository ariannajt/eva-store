// ============================================================================
// fetch-amazon-product
// ----------------------------------------------------------------------------
// Recibe un link de Amazon y trata de traer automáticamente el título, la
// foto y la descripción del producto, para no tener que escribirlo a mano.
//
// IMPORTANTE: Amazon bloquea seguido este tipo de lectura automática (le
// muestra un captcha al "robot"). Por eso esto es "mejor esfuerzo": cuando
// funciona ahorra tiempo, cuando no, el panel de administración deja
// completar los datos a mano igual.
// ============================================================================
import { corsHeaders } from "../_shared/cors.ts";

function extractMeta(html: string, property: string): string | null {
  const patterns = [
    new RegExp(`<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${property}["']`, "i"),
  ];
  for (const re of patterns) {
    const match = html.match(re);
    if (match) return match[1];
  }
  return null;
}

function extractTitleFallback(html: string): string | null {
  const match = html.match(/<span[^>]+id=["']productTitle["'][^>]*>([^<]+)<\/span>/i);
  return match ? match[1].trim() : null;
}

function extractPriceFallback(html: string): string | null {
  const match = html.match(/<span[^>]+class=["'][^"']*a-price-whole[^"']*["'][^>]*>([\d.,]+)</i);
  return match ? match[1].replace(/[.,]$/, "") : null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    if (!url || !/^https?:\/\/(www\.)?amazon\./i.test(url)) {
      return new Response(JSON.stringify({ error: "Link de Amazon inválido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
      },
    });

    if (!res.ok) {
      throw new Error(`Amazon respondió con estado ${res.status}`);
    }

    const html = await res.text();

    const title = extractMeta(html, "og:title") || extractTitleFallback(html);
    const image = extractMeta(html, "og:image");
    const description = extractMeta(html, "og:description");
    const price = extractPriceFallback(html);

    if (!title && !image) {
      return new Response(
        JSON.stringify({
          error: "No se pudo leer la página de Amazon automáticamente. Completa los datos a mano.",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({
        title: title?.trim() ?? null,
        image: image?.trim() ?? null,
        description: description?.trim() ?? null,
        price: price ?? null,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: `No se pudo leer el link: ${(err as Error).message}` }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
