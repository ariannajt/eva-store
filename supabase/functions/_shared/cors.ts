// Encabezados CORS compartidos por todas las funciones, para que el
// navegador (la página web) pueda llamarlas directamente.
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
