import { Link, Route, Routes } from "react-router-dom";

function Placeholder({ title, owner }: { title: string; owner: string }) {
  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="mt-2 text-slate-600">Placeholder. Implemented by {owner}. See docs/ux-guidelines.md.</p>
    </main>
  );
}

// Route map = the three portals. Keep max 4 nav items per role (docs/ux-guidelines.md).
export default function App() {
  return (
    <>
      <nav className="flex gap-4 border-b bg-white p-4 text-sm">
        <Link to="/" className="font-semibold text-teal-700">CivicPulse</Link>
        <Link to="/explore">Explore</Link>
        <Link to="/report">Report</Link>
        <Link to="/signin">Sign in</Link>
      </nav>
      <Routes>
        <Route path="/" element={<Placeholder title="Home" owner="Jerome" />} />
        <Route path="/explore" element={<Placeholder title="Explore reports (list + map)" owner="Jerome" />} />
        <Route path="/reports/:id" element={<Placeholder title="Report detail + timeline" owner="Jerome" />} />
        <Route path="/signin" element={<Placeholder title="Sign in / Sign up" owner="Jerome" />} />
        <Route path="/report" element={<Placeholder title="New report (3-step wizard)" owner="Jerome" />} />
        <Route path="/my" element={<Placeholder title="My reports + notifications (citizen)" owner="Jerome" />} />
        <Route path="/staff" element={<Placeholder title="Department queue (staff)" owner="Jerome" />} />
        <Route path="/admin" element={<Placeholder title="Admin: analytics, routing, users" owner="Jerome" />} />
      </Routes>
    </>
  );
}
