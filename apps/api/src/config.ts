import "dotenv/config";

export const config = {
  port: Number(process.env.PORT ?? 4000),
  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:5173",
  supabaseUrl: process.env.SUPABASE_URL ?? "",
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  mediaBucket: process.env.SUPABASE_MEDIA_BUCKET ?? "report-media",
  aiEnabled: process.env.AI_ENABLED === "true",
  groqApiKey: process.env.GROQ_API_KEY ?? "",
};
