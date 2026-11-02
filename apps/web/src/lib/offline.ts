import type { CreateReportInput, CreateReportResponse } from "@civicpulse/contract";
import { post } from "./api";
import { uploadFiles } from "./upload";

// Reports (with their photos) made while offline are kept in IndexedDB and sent when the network returns.
// Each entry is removed only after the server accepted it, so a retry can never create a duplicate.

export type QueuedReport = {
  id: string;
  createdAt: number;
  payload: Omit<CreateReportInput, "mediaIds">;
  files: File[];
};

const DB_NAME = "civicpulse-offline";
const STORE = "queue";

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: "id" });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function tx<T>(mode: IDBTransactionMode, run: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await open();
  return new Promise((resolve, reject) => {
    const req = run(db.transaction(STORE, mode).objectStore(STORE));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function enqueue(payload: QueuedReport["payload"], files: File[]): Promise<void> {
  const item: QueuedReport = { id: crypto.randomUUID(), createdAt: Date.now(), payload, files };
  await tx("readwrite", (s) => s.add(item));
}

export const pendingReports = (): Promise<QueuedReport[]> => tx("readonly", (s) => s.getAll() as IDBRequest<QueuedReport[]>);

let flushing = false;

/** Send every queued report. Returns how many were accepted. Stops quietly if the network is still down. */
export async function flushQueue(): Promise<number> {
  if (flushing || !navigator.onLine) return 0;
  flushing = true;
  let sent = 0;
  try {
    for (const item of await pendingReports()) {
      try {
        const mediaIds = await uploadFiles(item.files);
        await post<CreateReportResponse>("/reports", { ...item.payload, mediaIds });
        await tx("readwrite", (s) => s.delete(item.id));
        sent++;
      } catch {
        break; // still offline, or signed out; try again on the next trigger
      }
    }
  } finally {
    flushing = false;
  }
  return sent;
}

/** True for failures that mean "no network", as opposed to a server rejection we should show. */
export const isNetworkError = (e: unknown) => !navigator.onLine || e instanceof TypeError;
