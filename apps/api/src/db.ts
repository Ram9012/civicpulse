import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { config } from "./config.js";

let client: SupabaseClient | null = null;

/** Server-side Supabase client (service role). Never expose this key to the web app. */
export function db(): SupabaseClient {
  if (!client) {
    if (!config.supabaseUrl || !config.supabaseServiceKey) {
      throw new Error("Supabase env vars missing. See .env.example");
    }
    client = createClient(config.supabaseUrl, config.supabaseServiceKey, {
      auth: { persistSession: false },
    });
  }
  return client;
}
