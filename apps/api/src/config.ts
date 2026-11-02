import { config as loadEnv } from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

// npm runs workspace scripts with cwd = apps/api, so plain "dotenv/config" would miss the single
// root .env. Load it explicitly (works from both src/ and dist/). On Render the vars are real env
// vars and the file simply doesn't exist, which dotenv ignores.
const here = path.dirname(fileURLToPath(import.meta.url));
loadEnv({ path: path.resolve(here, "../../../.env") });

export const config = {
  port: Number(process.env.PORT ?? 4000),
  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:5173",
  supabaseUrl: process.env.SUPABASE_URL ?? "",
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  mediaBucket: process.env.SUPABASE_MEDIA_BUCKET ?? "report-media",
  aiEnabled: process.env.AI_ENABLED === "true",
  groqApiKey: process.env.GROQ_API_KEY ?? "",
};
