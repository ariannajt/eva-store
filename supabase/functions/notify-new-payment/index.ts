// ============================================================================
// notify-new-payment
// ----------------------------------------------------------------------------
// Se llama justo después de crear un pedido online (create_online_order).
// Avisa al vendedor por email y/o WhatsApp que llegó un comprobante de pago
// nuevo para revisar. Ambos canales son OPCIONALES: si no configuras las
// variables de entorno de uno, simplemente no se envía por ese canal.
//
// Variables de entorno necesarias (se configuran con `supabase secrets set`,
// ver README.md):
//   - Email (usa Resend, https://resend.com, tiene plan gratis):
//       RESEND_API_KEY, NOTIFY_EMAIL_TO, NOTIFY_EMAIL_FROM
//   - WhatsApp (usa CallMeBot, https://www.callmebot.com/blog/free-api-whatsapp-messages,
//     gratis para avisos a tu propio número):
//       CALLMEBOT_PHONE, CALLMEBOT_APIKEY
// ============================================================================
import { createClient } from "jsr:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { orderId } = await req.json();
    if (!orderId) throw new Error("Falta orderId");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: order, error } = await supabase
      .from("orders")
      .select("id, customer_name, customer_contact, total, created_at, order_items(product_name, quantity)")
      .eq("id", orderId)
      .single();

    if (error || !order) throw new Error("Pedido no encontrado");

    const itemsText = (order.order_items ?? [])
      .map((it: { product_name: string; quantity: number }) => `- ${it.quantity}x ${it.product_name}`)
      .join("\n");

    const message =
      `Nuevo pedido pendiente de confirmar\n` +
      `Cliente: ${order.customer_name || "(sin nombre)"} (${order.customer_contact || "sin contacto"})\n` +
      `Total: $${order.total}\n` +
      `${itemsText}\n` +
      `Revisa el comprobante en el panel de administración.`;

    const results: Record<string, string> = {};

    const resendKey = Deno.env.get("RESEND_API_KEY");
    const emailTo = Deno.env.get("NOTIFY_EMAIL_TO");
    const emailFrom = Deno.env.get("NOTIFY_EMAIL_FROM");
    if (resendKey && emailTo && emailFrom) {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: emailFrom,
          to: emailTo,
          subject: `Nuevo pedido - $${order.total}`,
          text: message,
        }),
      });
      results.email = res.ok ? "enviado" : `error (${res.status})`;
    } else {
      results.email = "no configurado";
    }

    const cmbPhone = Deno.env.get("CALLMEBOT_PHONE");
    const cmbKey = Deno.env.get("CALLMEBOT_APIKEY");
    if (cmbPhone && cmbKey) {
      const url = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(cmbPhone)}&apikey=${encodeURIComponent(cmbKey)}&text=${encodeURIComponent(message)}`;
      const res = await fetch(url);
      results.whatsapp = res.ok ? "enviado" : `error (${res.status})`;
    } else {
      results.whatsapp = "no configurado";
    }

    return new Response(JSON.stringify({ ok: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: (err as Error).message }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
