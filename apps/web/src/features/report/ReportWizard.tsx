import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CATEGORIES,
  CATEGORY_LABELS,
  type Category,
  type CreateReportInput,
  type CreateReportResponse,
  type Report,
  type UploadUrlResponse,
} from "@civicpulse/contract";
import { useState, type ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ReportCard } from "../../components/ReportCard";
import { MapPicker } from "../../components/maps";
import { api, post } from "../../lib/api";
import { MEDIA_BUCKET, supabase } from "../../lib/supabase";

interface Uploaded {
  mediaId: string;
  url: string;
  kind: "photo" | "video";
  name: string;
}

const STEPS = ["Photo", "Location", "Details"];

export default function ReportWizard() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [step, setStep] = useState(0);
  const [files, setFiles] = useState<Uploaded[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [pin, setPin] = useState<{ lat: number; lng: number } | null>(null);
  const [areaLabel, setAreaLabel] = useState("");
  const [geoError, setGeoError] = useState<string | null>(null);
  const [category, setCategory] = useState<Category | "">("");
  const [description, setDescription] = useState("");
  const [anonymous, setAnonymous] = useState(false);

  async function onFiles(e: ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []).slice(0, 5 - files.length);
    e.target.value = "";
    setUploading(true);
    setUploadError(null);
    try {
      const done: Uploaded[] = [];
      for (const file of picked) {
        const kind = file.type.startsWith("video/") ? "video" : "photo";
        const signed = await post<UploadUrlResponse>("/media/upload-url", { kind, contentType: file.type });
        const { error } = await supabase.storage.from(MEDIA_BUCKET).uploadToSignedUrl(signed.path, signed.token, file);
        if (error) throw error;
        done.push({ mediaId: signed.mediaId, url: signed.publicUrl, kind, name: file.name });
      }
      setFiles((f) => [...f, ...done]);
    } catch (err) {
      setUploadError((err as Error).message);
    } finally {
      setUploading(false);
    }
  }

  function locate() {
    setGeoError(null);
    if (!navigator.geolocation) return setGeoError("Location is not available on this device. Tap the map instead.");
    navigator.geolocation.getCurrentPosition(
      (p) => setPin({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => setGeoError("Could not get your location. Tap the map to place the pin."),
      { enableHighAccuracy: true, timeout: 10_000 }
    );
  }

  const nearby = useQuery({
    queryKey: ["nearby", pin?.lat, pin?.lng, category],
    queryFn: () =>
      api<Report[]>(`/reports/nearby?lat=${pin!.lat}&lng=${pin!.lng}&category=${category}`),
    enabled: step === 2 && !!pin && !!category,
    refetchInterval: false,
  });

  const submit = useMutation({
    mutationFn: () => {
      const body: CreateReportInput = {
        category: category as Category,
        description,
        lat: pin!.lat,
        lng: pin!.lng,
        areaLabel: areaLabel.trim() || undefined,
        anonymous,
        mediaIds: files.map((f) => f.mediaId),
      };
      return post<CreateReportResponse>("/reports", body);
    },
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["reports"] });
      navigate(`/reports/${res.report.id}`);
    },
  });

  const canNext = step === 0 ? files.length > 0 && !uploading : step === 1 ? !!pin : !!category && description.trim().length >= 5;
  const field = "mt-1 w-full rounded border px-3 py-2";

  return (
    <main className="mx-auto max-w-xl space-y-5 p-4">
      <h1 className="text-2xl font-semibold">Report an issue</h1>
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
          <p className="text-slate-600">Add a photo or short video of the problem (up to 5).</p>
          <label className="flex min-h-24 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed bg-white p-4 text-center text-teal-800">
            {uploading ? "Uploading..." : "Take a photo or choose files"}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm"
              capture="environment"
              multiple
              className="sr-only"
              disabled={uploading || files.length >= 5}
              onChange={onFiles}
            />
          </label>
          {uploadError && <p role="alert" className="text-sm text-red-700">{uploadError}</p>}
          <ul className="grid grid-cols-3 gap-2">
            {files.map((f) => (
              <li key={f.mediaId}>
                {f.kind === "photo" ? (
                  <img src={f.url} alt={f.name} className="h-24 w-full rounded object-cover" />
                ) : (
                  <video src={f.url} className="h-24 w-full rounded object-cover" />
                )}
                <button
                  type="button"
                  className="mt-1 min-h-11 w-full text-xs text-red-700"
                  onClick={() => setFiles((x) => x.filter((y) => y.mediaId !== f.mediaId))}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {step === 1 && (
        <section className="space-y-3">
          <p className="text-slate-600">Tap the map to drop a pin, or use your location.</p>
          <button type="button" onClick={locate} className="min-h-11 rounded border bg-white px-4">
            📍 Use my location
          </button>
          {geoError && <p role="alert" className="text-sm text-red-700">{geoError}</p>}
          <MapPicker value={pin} onChange={(lat, lng) => setPin({ lat, lng })} />
          <label className="block text-sm">
            Area or landmark (shown publicly instead of your exact address)
            <input
              className={field}
              value={areaLabel}
              maxLength={120}
              placeholder="e.g. Racecourse Road, Ward 12"
              onChange={(e) => setAreaLabel(e.target.value)}
            />
          </label>
        </section>
      )}

      {step === 2 && (
        <section className="space-y-4">
          <label className="block text-sm">
            What kind of problem is it?
            <select className={field} value={category} onChange={(e) => setCategory(e.target.value as Category)}>
              <option value="" disabled>Choose a category</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            Describe it briefly
            <textarea
              className={field}
              rows={4}
              maxLength={1000}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>
          <label className="flex min-h-11 items-center gap-2 text-sm">
            <input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} />
            Hide my name on public pages
          </label>

          {nearby.data && nearby.data.length > 0 && (
            <div className="rounded-lg border border-amber-300 bg-amber-50 p-3">
              <p className="mb-2 text-sm font-medium">Already reported nearby? Confirm it instead of filing a new one:</p>
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
          Back
        </button>
        {step < 2 ? (
          <button
            type="button"
            disabled={!canNext}
            onClick={() => setStep(step + 1)}
            className="min-h-11 rounded bg-teal-700 px-6 font-medium text-white disabled:opacity-40"
          >
            Next
          </button>
        ) : (
          <button
            type="button"
            disabled={!canNext || submit.isPending}
            onClick={() => submit.mutate()}
            className="min-h-11 rounded bg-teal-700 px-6 font-medium text-white disabled:opacity-40"
          >
            {submit.isPending ? "Submitting..." : "Submit report"}
          </button>
        )}
      </div>
    </main>
  );
}
