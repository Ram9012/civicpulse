import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CATEGORIES,
  type AiSuggestion,
  type Category,
  type CreateReportInput,
  type CreateReportResponse,
  type Report,
} from "@civicpulse/contract";
import { useCallback, useEffect, useRef, useState, type ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ReportCard } from "../../components/ReportCard";
import { MapPicker } from "../../components/maps";
import { api, post } from "../../lib/api";
import { LANGS, useI18n, type Key } from "../../lib/i18n";
import { enqueue, isNetworkError } from "../../lib/offline";
import { useSpeech } from "../../lib/speech";
import { uploadFiles } from "../../lib/upload";

interface Picked {
  file: File;
  preview: string;
}

const DRAFT_KEY = "report-draft";
interface Draft {
  pin: { lat: number; lng: number } | null;
  areaLabel: string;
  category: Category | "";
  description: string;
  anonymous: boolean;
}

function loadDraft(): Draft {
  try {
    const d = JSON.parse(localStorage.getItem(DRAFT_KEY) ?? "null") as Draft | null;
    if (d) return d;
  } catch {
    /* ignore */
  }
  return { pin: null, areaLabel: "", category: "", description: "", anonymous: false };
}

export default function ReportWizard() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { t, lang } = useI18n();
  const [step, setStep] = useState(0);
  const [picked, setPicked] = useState<Picked[]>([]);
  const [draft, setDraft] = useState<Draft>(loadDraft);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [offlineSaved, setOfflineSaved] = useState(false);
  const previews = useRef<string[]>([]);
  const { pin, areaLabel, category, description, anonymous } = draft;
  const patch = (p: Partial<Draft>) => setDraft((d) => ({ ...d, ...p }));

  // Text fields survive a refresh or a dropped connection (files cannot be stored in localStorage).
  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch {
      /* ignore */
    }
  }, [draft]);
  useEffect(() => () => previews.current.forEach(URL.revokeObjectURL), []);

  function onFiles(e: ChangeEvent<HTMLInputElement>) {
    const next = Array.from(e.target.files ?? [])
      .slice(0, 5 - picked.length)
      .map((file) => {
        const preview = URL.createObjectURL(file);
        previews.current.push(preview);
        return { file, preview };
      });
    e.target.value = "";
    setPicked((p) => [...p, ...next]);
  }

  function locate() {
    setGeoError(null);
    if (!navigator.geolocation) return setGeoError("Location is not available on this device. Tap the map instead.");
    navigator.geolocation.getCurrentPosition(
      (p) => patch({ pin: { lat: p.coords.latitude, lng: p.coords.longitude } }),
      () => setGeoError("Could not get your location. Tap the map to place the pin."),
      { enableHighAccuracy: true, timeout: 10_000 }
    );
  }

  const speech = useSpeech(
    LANGS.find((l) => l.code === lang)!.speech,
    useCallback((text: string) => setDraft((d) => ({ ...d, description: `${d.description} ${text}`.trim() })), [])
  );

  // Advisory AI: suggest a category from the description (staff still review everything).
  const [debounced, setDebounced] = useState("");
  useEffect(() => {
    const h = setTimeout(() => setDebounced(description.trim()), 700);
    return () => clearTimeout(h);
  }, [description]);
  const suggestion = useQuery({
    queryKey: ["ai-suggest", debounced],
    queryFn: () => post<AiSuggestion>("/ai/suggest", { description: debounced }),
    enabled: step === 2 && debounced.length >= 8 && navigator.onLine,
    refetchInterval: false,
    staleTime: Infinity,
    retry: false,
  });

  const nearby = useQuery({
    queryKey: ["nearby", pin?.lat, pin?.lng, category],
    queryFn: () => api<Report[]>(`/reports/nearby?lat=${pin!.lat}&lng=${pin!.lng}&category=${category}`),
    enabled: step === 2 && !!pin && !!category && navigator.onLine,
    refetchInterval: false,
    retry: false,
  });

  const submit = useMutation({
    mutationFn: async () => {
      const base: Omit<CreateReportInput, "mediaIds"> = {
        category: category as Category,
        description,
        lat: pin!.lat,
        lng: pin!.lng,
        areaLabel: areaLabel.trim() || undefined,
        anonymous,
      };
      const files = picked.map((p) => p.file);
      if (!navigator.onLine) {
        await enqueue(base, files);
        return null;
      }
      try {
        const mediaIds = await uploadFiles(files);
        return await post<CreateReportResponse>("/reports", { ...base, mediaIds });
      } catch (e) {
        if (isNetworkError(e)) {
          await enqueue(base, files);
          return null;
        }
        throw e;
      }
    },
    onSuccess: (res) => {
      try {
        localStorage.removeItem(DRAFT_KEY);
      } catch {
        /* ignore */
      }
      if (res) {
        qc.invalidateQueries({ queryKey: ["reports"] });
        navigate(`/reports/${res.report.id}`);
      } else {
        setOfflineSaved(true);
      }
    },
  });

  const STEPS = [t("wiz.step1"), t("wiz.step2"), t("wiz.step3")];
  const canNext = step === 0 ? picked.length > 0 : step === 1 ? !!pin : !!category && description.trim().length >= 5;
  const field = "mt-1 w-full rounded border px-3 py-2";

  if (offlineSaved) {
    return (
      <main className="mx-auto max-w-xl space-y-4 p-4">
        <p role="status" className="rounded-lg border border-amber-300 bg-amber-50 p-4">{t("wiz.savedOffline")}</p>
        <button onClick={() => navigate("/my")} className="min-h-11 rounded bg-teal-700 px-5 text-white">
          {t("nav.my")}
        </button>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-xl space-y-5 p-4">
      <h1 className="text-2xl font-semibold">{t("wiz.title")}</h1>
      <ol className="flex gap-2 text-sm" aria-label="Progress">
        {STEPS.map((s, i) => (
          <li
            key={s}
            aria-current={i === step ? "step" : undefined}
            className={`flex-1 rounded px-2 py-1 text-center ${i === step ? "bg-teal-700 text-white" : i < step ? "bg-teal-100" : "bg-slate-100"}`}
          >
            {i + 1}. {s}
          </li>
        ))}
      </ol>

      {step === 0 && (
        <section className="space-y-3">
          <p className="text-slate-600">{t("wiz.photoHelp")}</p>
          <label className="flex min-h-24 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed bg-white p-4 text-center text-teal-800">
            {t("wiz.choose")}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm"
              capture="environment"
              multiple
              className="sr-only"
              disabled={picked.length >= 5}
              onChange={onFiles}
            />
          </label>
          <ul className="grid grid-cols-3 gap-2">
            {picked.map((p) => (
              <li key={p.preview}>
                {p.file.type.startsWith("video/") ? (
                  <video src={p.preview} className="h-24 w-full rounded object-cover" />
                ) : (
                  <img src={p.preview} alt={p.file.name} className="h-24 w-full rounded object-cover" />
                )}
                <button
                  type="button"
                  className="mt-1 min-h-11 w-full text-xs text-red-700"
                  onClick={() => setPicked((x) => x.filter((y) => y.preview !== p.preview))}
                >
                  {t("wiz.remove")}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {step === 1 && (
        <section className="space-y-3">
          <p className="text-slate-600">{t("wiz.mapHelp")}</p>
          <button type="button" onClick={locate} className="min-h-11 rounded border bg-white px-4">
            📍 {t("wiz.locate")}
          </button>
          {geoError && <p role="alert" className="text-sm text-red-700">{geoError}</p>}
          <MapPicker value={pin} onChange={(lat, lng) => patch({ pin: { lat, lng } })} />
          <label className="block text-sm">
            {t("wiz.area")}
            <input
              className={field}
              value={areaLabel}
              maxLength={120}
              placeholder="e.g. Racecourse Road, Ward 12"
              onChange={(e) => patch({ areaLabel: e.target.value })}
            />
          </label>
        </section>
      )}

      {step === 2 && (
        <section className="space-y-4">
          <label className="block text-sm">
            {t("wiz.describe")}
            <textarea
              className={field}
              rows={4}
              maxLength={1000}
              value={description}
              onChange={(e) => patch({ description: e.target.value })}
            />
          </label>
          {speech.supported && (
            <button
              type="button"
              onClick={speech.toggle}
              aria-pressed={speech.listening}
              className={`min-h-11 rounded border px-4 text-sm ${speech.listening ? "bg-red-600 text-white" : "bg-white"}`}
            >
              🎤 {speech.listening ? t("wiz.listening") : t("wiz.voice")}
            </button>
          )}

          {suggestion.data && suggestion.data.category !== category && suggestion.data.confidence >= 0.4 && (
            <p className="flex flex-wrap items-center gap-2 rounded bg-teal-50 p-2 text-sm">
              {t("wiz.aiSuggests")} <strong>{t(`cat.${suggestion.data.category}` as Key)}</strong>
              <button
                type="button"
                className="min-h-11 rounded border bg-white px-3"
                onClick={() => patch({ category: suggestion.data!.category })}
              >
                {t("wiz.use")}
              </button>
            </p>
          )}

          <label className="block text-sm">
            {t("wiz.category")}
            <select className={field} value={category} onChange={(e) => patch({ category: e.target.value as Category })}>
              <option value="" disabled>{t("wiz.chooseCat")}</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{t(`cat.${c}` as Key)}</option>
              ))}
            </select>
          </label>
          <label className="flex min-h-11 items-center gap-2 text-sm">
            <input type="checkbox" checked={anonymous} onChange={(e) => patch({ anonymous: e.target.checked })} />
            {t("wiz.anonymous")}
          </label>

          {nearby.data && nearby.data.length > 0 && (
            <div className="rounded-lg border border-amber-300 bg-amber-50 p-3">
              <p className="mb-2 text-sm font-medium">{t("wiz.nearby")}</p>
              <ul className="space-y-2">
                {nearby.data.map((r) => (
                  <li key={r.id}><ReportCard report={r} /></li>
                ))}
              </ul>
            </div>
          )}
          {submit.error && <p role="alert" className="text-sm text-red-700">{(submit.error as Error).message}</p>}
        </section>
      )}

      <div className="flex justify-between">
        <button
          type="button"
          disabled={step === 0}
          onClick={() => setStep(step - 1)}
          className="min-h-11 rounded border bg-white px-5 disabled:opacity-40"
        >
          {t("wiz.back")}
        </button>
        {step < 2 ? (
          <button
            type="button"
            disabled={!canNext}
            onClick={() => setStep(step + 1)}
            className="min-h-11 rounded bg-teal-700 px-6 font-medium text-white disabled:opacity-40"
          >
            {t("wiz.next")}
          </button>
        ) : (
          <button
            type="button"
            disabled={!canNext || submit.isPending}
            onClick={() => submit.mutate()}
            className="min-h-11 rounded bg-teal-700 px-6 font-medium text-white disabled:opacity-40"
          >
            {submit.isPending ? t("wiz.submitting") : t("wiz.submit")}
          </button>
        )}
      </div>
    </main>
  );
}
