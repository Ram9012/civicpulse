import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useAuth } from "../lib/auth";
import { useI18n } from "../lib/i18n";
import { flushQueue, pendingReports } from "../lib/offline";

/** Shows offline-saved reports and uploads them automatically when the network (and a session) is back. */
export function SyncBanner() {
  const { t } = useI18n();
  const { session } = useAuth();
  const qc = useQueryClient();
  const [pending, setPending] = useState(0);
  const [synced, setSynced] = useState(0);

  useEffect(() => {
    let alive = true;
    const run = async () => {
      try {
        const sent = await flushQueue();
        if (sent > 0 && alive) {
          setSynced(sent);
          qc.invalidateQueries({ queryKey: ["reports"] });
        }
        if (alive) setPending((await pendingReports()).length);
      } catch {
        /* IndexedDB unavailable: nothing to sync */
      }
    };
    if (session) run();
    window.addEventListener("online", run);
    const timer = setInterval(run, 30_000);
    return () => {
      alive = false;
      window.removeEventListener("online", run);
      clearInterval(timer);
    };
  }, [session, qc]);

  if (!pending && !synced) return null;
  return (
    <p role="status" className="bg-amber-100 px-4 py-2 text-center text-sm text-amber-900">
      {pending > 0 ? t("offline.pending", { n: pending }) : t("offline.synced", { n: synced })}
    </p>
  );
}
