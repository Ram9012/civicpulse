import { createClient } from "@supabase/supabase-js";

// Only Auth (sign in/up) and signed-URL uploads use Supabase directly. All data goes through the API.
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL ?? "http://localhost:54321",
  import.meta.env.VITE_SUPABASE_ANON_KEY ?? "missing-anon-key"
);

export const MEDIA_BUCKET = import.meta.env.VITE_SUPABASE_MEDIA_BUCKET ?? "report-media";
