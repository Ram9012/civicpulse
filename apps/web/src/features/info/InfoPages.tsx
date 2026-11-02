import { useQuery } from "@tanstack/react-query";
import type { PublicStats } from "@civicpulse/contract";
import { Link } from "react-router-dom";
import { Stat, WeeklyChart } from "../../components/charts";
import { api } from "../../lib/api";

const wrap = "mx-auto max-w-3xl space-y-6 p-4";

export function HowItWorks() {
  const steps = [
    ["Capture", "Add a photo or video. Pin the location on the map or use GPS. No signal? Your report is saved on your phone and sent when you are back online."],
    ["Connect", "Describe the problem by typing or speaking, in English, Kannada or Hindi. An assistant suggests a category and priority; staff review everything."],
    ["Resolve", "Get a tracking ID and follow the timeline. See before-and-after photos and get notified at each step. Reopen it if it is not fixed."],
  ];
  const stages = [
    ["Submitted", "You send the photo, location and description."],
    ["Verified", "Municipal staff confirm the issue and its priority."],
    ["Assigned", "A field worker is assigned."],
    ["In progress", "Work has started; on-site photos may be added."],
    ["Resolved", "A proof photo is uploaded and the report is closed."],
    ["Reopened / Duplicate", "You can reopen a report that is not fixed. Repeats are merged into the original."],
  ];
  const routing = [
    ["Road damage / pothole", "Public Works, Roads"],
    ["Garbage accumulation", "Sanitation"],
    ["Streetlight / electricity", "Electrical"],
    ["Water leakage, drainage, sewage", "Water Supply & Sewerage"],
    ["Traffic signal fault", "Traffic"],
    ["Park maintenance", "Parks"],
  ];
  return (
    <main className={wrap}>
      <h1 className="text-2xl font-semibold">How it works</h1>
      <ol className="space-y-3">
        {steps.map(([t, d], i) => (
          <li key={t} className="rounded-lg border bg-white p-3"><strong>{i + 1}. {t}</strong><p className="text-slate-600">{d}</p></li>
        ))}
      </ol>
      <section>
        <h2 className="mb-2 font-semibold">Status stages</h2>
        <ul className="space-y-1 text-sm">{stages.map(([t, d]) => <li key={t}><strong>{t}:</strong> {d}</li>)}</ul>
      </section>
      <section>
        <h2 className="mb-2 font-semibold">Where your report goes</h2>
        <table className="w-full text-left text-sm"><tbody>{routing.map(([a, b]) => <tr key={a} className="border-b"><td className="py-1">{a}</td><td>{b}</td></tr>)}</tbody></table>
        <p className="mt-2 text-sm text-slate-600">A person reviews every automatic suggestion before a task is assigned. Administrators can change these rules.</p>
      </section>
      <Link to="/report" className="inline-flex min-h-11 items-center rounded bg-teal-700 px-5 text-white">Report an issue</Link>
    </main>
  );
}

export function Impact() {
  const { data, isLoading, error } = useQuery({ queryKey: ["stats"], queryFn: () => api<PublicStats>("/stats/public") });
  return (
    <main className={wrap}>
      <h1 className="text-2xl font-semibold">Community impact</h1>
      <p className="text-slate-600">Live numbers from real reports. Nothing here is made up.</p>
      {isLoading && <p className="text-slate-500">Loading...</p>}
      {error && <p role="alert" className="text-red-700">{(error as Error).message}</p>}
      {data && (
        <>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Stat label="Reports submitted" value={data.reportsSubmitted} />
            <Stat label="Issues resolved" value={data.issuesResolved} />
            <Stat label="Departments connected" value={data.departmentsConnected} />
            <Stat label="Avg response" value={data.avgResponseDays === null ? "n/a" : `${data.avgResponseDays} d`} />
          </div>
          <section><h2 className="mb-2 font-semibold">Weekly volume</h2><WeeklyChart data={data.weekly} /></section>
          <section className="overflow-x-auto">
            <h2 className="mb-2 font-semibold">By department</h2>
            <table className="w-full min-w-[420px] text-left text-sm">
              <thead><tr className="border-b text-slate-500"><th className="py-1">Department</th><th>Open</th><th>Resolved (month)</th><th>Avg days</th></tr></thead>
              <tbody>{data.departments.map((d) => <tr key={d.id} className="border-b"><td className="py-1">{d.name}</td><td>{d.open}</td><td>{d.resolvedThisMonth}</td><td>{d.avgDays ?? "n/a"}</td></tr>)}</tbody>
            </table>
          </section>
        </>
      )}
    </main>
  );
}

export function Help() {
  const faqs = [
    ["How long does a report take?", "Under a minute: add a photo, confirm the location, describe the issue and submit."],
    ["What is the tracking ID?", "Every report gets an ID like CIV-10482. Find it in My reports, or ask the assistant for its status."],
    ["Can I report anonymously?", "Yes. Your name is hidden on public pages. Staff can still act on the report."],
    ["What about duplicates?", "We check for open reports of the same kind nearby. Confirm the existing one instead of filing a new one; confirmations raise priority."],
    ["Does it work offline?", "Yes. Reports and photos are saved on your device and uploaded automatically when you are online."],
    ["Which languages?", "English, Kannada and Hindi for the app, and for voice descriptions where your browser supports speech input."],
  ];
  return (
    <main className={wrap}>
      <h1 className="text-2xl font-semibold">Help</h1>
      <dl className="space-y-3">{faqs.map(([q, a]) => <div key={q}><dt className="font-medium">{q}</dt><dd className="text-slate-600">{a}</dd></div>)}</dl>
      <section>
        <h2 className="mb-1 font-semibold">Privacy</h2>
        <ul className="list-disc pl-5 text-sm text-slate-600">
          <li>Location is used only to route and resolve your report.</li>
          <li>Contact details are never shown on public pages.</li>
          <li>Media is stored with access controls. You can delete your own reports.</li>
        </ul>
      </section>
      <section>
        <h2 className="mb-1 font-semibold">Terms</h2>
        <ul className="list-disc pl-5 text-sm text-slate-600">
          <li>Report genuine civic issues in your area.</li>
          <li>Do not upload media showing identifiable private information.</li>
          <li>For emergencies call 100 (police), 101 (fire), 108 (ambulance) or 112 first.</li>
          <li>Abusive or false reports may be removed.</li>
        </ul>
      </section>
      <section>
        <h2 className="mb-1 font-semibold">Accessibility</h2>
        <p className="text-sm text-slate-600">Full keyboard navigation, visible focus, status shown with text and icons, reduced-motion respected, touch targets of at least 44 px.</p>
      </section>
    </main>
  );
}
