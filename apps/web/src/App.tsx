import { Link, NavLink, Route, Routes } from "react-router-dom";
import { RequireAuth, useAuth } from "./lib/auth";
import SignIn from "./features/auth/SignIn";
import Explore from "./features/explore/Explore";
import Home from "./features/home/Home";
import MyReports from "./features/my/MyReports";
import ReportDetailPage from "./features/report/ReportDetailPage";
import ReportWizard from "./features/report/ReportWizard";

function Placeholder({ title, note }: { title: string; note: string }) {
  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="mt-2 text-slate-600">{note}</p>
    </main>
  );
}

// Max 4 nav items per role (docs/ux-guidelines.md).
function Nav() {
  const { session, profile, signOut } = useAuth();
  const item = ({ isActive }: { isActive: boolean }) =>
    `inline-flex min-h-11 items-center px-2 ${isActive ? "font-semibold text-teal-700" : "text-slate-700"}`;
  return (
    <nav className="flex flex-wrap items-center gap-2 border-b bg-white px-4 text-sm" aria-label="Main">
      <Link to="/" className="mr-2 inline-flex min-h-11 items-center font-bold text-teal-700">CivicPulse</Link>
      <NavLink to="/explore" className={item}>Explore</NavLink>
      <NavLink to="/report" className={item}>Report</NavLink>
      {profile?.role === "staff" && <NavLink to="/staff" className={item}>Queue</NavLink>}
      {profile?.role === "admin" && <NavLink to="/admin" className={item}>Admin</NavLink>}
      {session ? (
        <>
          <NavLink to="/my" className={item}>My reports</NavLink>
          <button onClick={signOut} className="ml-auto min-h-11 px-2 text-slate-500">Sign out</button>
        </>
      ) : (
        <NavLink to="/signin" className={`${item({ isActive: false })} ml-auto`}>Sign in</NavLink>
      )}
    </nav>
  );
}

export default function App() {
  return (
    <>
      <Nav />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/reports/:id" element={<ReportDetailPage />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/report" element={<RequireAuth><ReportWizard /></RequireAuth>} />
        <Route path="/my" element={<RequireAuth><MyReports /></RequireAuth>} />
        <Route
          path="/staff"
          element={<RequireAuth roles={["staff", "admin"]}><Placeholder title="Department queue" note="Coming in milestone 2." /></RequireAuth>}
        />
        <Route
          path="/admin"
          element={<RequireAuth roles={["admin"]}><Placeholder title="Admin" note="Coming in milestone 3." /></RequireAuth>}
        />
      </Routes>
    </>
  );
}
