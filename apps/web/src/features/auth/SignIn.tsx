import { useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../../lib/supabase";

export default function SignIn() {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const next = useSearchParams()[0].get("next") ?? "/";

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);
    if (mode === "up") {
      const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { name } } });
      if (error) setError(error.message);
      else if (!data.session) setNotice("Check your email to confirm your account, then sign in.");
      else navigate(next, { replace: true });
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
      else navigate(next, { replace: true });
    }
    setBusy(false);
  }

  const input = "mt-1 w-full rounded border px-3 py-2";
  return (
    <main className="mx-auto max-w-sm p-6">
      <h1 className="text-2xl font-semibold">{mode === "in" ? "Sign in" : "Create account"}</h1>
      <form onSubmit={submit} className="mt-4 space-y-4">
        {mode === "up" && (
          <label className="block text-sm">
            Your name
            <input className={input} value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
        )}
        <label className="block text-sm">
          Email
          <input className={input} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label className="block text-sm">
          Password
          <input
            className={input}
            type="password"
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        {notice && <p role="status" className="text-sm text-teal-700">{notice}</p>}
        <button
          disabled={busy}
          className="min-h-11 w-full rounded bg-teal-700 px-4 font-medium text-white disabled:opacity-50"
        >
          {busy ? "Please wait..." : mode === "in" ? "Sign in" : "Create account"}
        </button>
      </form>
      <button
        type="button"
        onClick={() => setMode(mode === "in" ? "up" : "in")}
        className="mt-4 min-h-11 text-sm text-teal-700 underline"
      >
        {mode === "in" ? "New here? Create an account" : "Have an account? Sign in"}
      </button>
    </main>
  );
}
