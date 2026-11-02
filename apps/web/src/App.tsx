import { Link, NavLink, Route, Routes } from "react-router-dom";
import { Assistant } from "./components/Assistant";
import { SyncBanner } from "./components/SyncBanner";
import AdminPage from "./features/admin/AdminPage";
import SignIn from "./features/auth/SignIn";
import Explore from "./features/explore/Explore";
import Home from "./features/home/Home";
import { Help, HowItWorks, Impact } from "./features/info/InfoPages";
import MyReports from "./features/my/MyReports";
import ReportDetailPage from "./features/report/ReportDetailPage";
import ReportWizard from "./features/report/ReportWizard";
import StaffPage from "./features/staff/StaffPage";
import { RequireAuth, useAuth } from "./lib/auth";
import { LANGS, useI18n, type Lang } from "./lib/i18n";

// Max 4 primary nav items per role; account actions live in the Account menu (docs/ux-guidelines.md).
function Nav() {
  const { session, profile, signOut } = useAuth();
  const { t, lang, setLang } = useI18n();
  const item = ({ isActive }: { isActive: boolean }) =>
    `inline-flex min-h-11 items-center px-2 ${isActive ? "font-semibold text-teal-700" : "text-slate-700"}`;
  return (
    <nav className="flex flex-wrap items-center gap-1 border-b bg-white px-4 text-sm" aria-label="Main">
      <Link to="/" className="mr-2 inline-flex min-h-11 items-center font-bold text-teal-700">CivicPulse</Link>
      <NavLink to="/explore" className={item}>{t("nav.explore")}</NavLink>
      <NavLink to="/report" className={item}>{t("nav.report")}</NavLink>
      {(profile?.role === "staff" || profile?.role === "admin") && <NavLink to="/staff" className={item}>{t("nav.queue")}</NavLink>}
      {profile?.role === "admin" && <NavLink to="/admin" className={item}>{t("nav.admin")}</NavLink>}
      <div className="ml-auto flex items-center gap-2">
        <select
          aria-label="Language"
          className="min-h-11 rounded border bg-white px-2"
          value={lang}
          onChange={(e) => setLang(e.target.value as Lang)}
        >
          {LANGS.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
        </select>
        {session ? (
          <details className="relative">
            <summary className="flex min-h-11 cursor-pointer list-none items-center px-2">{profile?.name ?? t("nav.account")} ▾</summary>
            <div className="absolute right-0 z-[1000] w-44 rounded border bg-white p-1 shadow">
              <Link to="/my" className="flex min-h-11 items-center px-2">{t("nav.my")}</Link>
              <button onClick={signOut} className="flex min-h-11 w-full items-center px-2 text-left">{t("nav.signout")}</button>
            </div>
          </details>
        ) : (
          <NavLink to="/signin" className={item}>{t("nav.signin")}</NavLink>
        )}
      </div>
    </nav>
  );
}

function Footer() {
  const { t } = useI18n();
  return (
    <footer className="mt-12 border-t bg-white px-4 py-6 text-center text-sm text-slate-500">
      <Link to="/how-it-works" className="mx-3 inline-flex min-h-11 items-center">{t("footer.how")}</Link>
      <Link to="/impact" className="mx-3 inline-flex min-h-11 items-center">{t("footer.impact")}</Link>
      <Link to="/help" className="mx-3 inline-flex min-h-11 items-center">{t("footer.help")}</Link>
    </footer>
  );
}

export default function App() {
  return (
    <>
      <Nav />
      <SyncBanner />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/reports/:id" element={<ReportDetailPage />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/how-it-works" element={<HowItWorks />} />
        <Route path="/impact" element={<Impact />} />
        <Route path="/help" element={<Help />} />
        <Route path="/report" element={<RequireAuth><ReportWizard /></RequireAuth>} />
        <Route path="/my" element={<RequireAuth><MyReports /></RequireAuth>} />
        <Route path="/staff" element={<RequireAuth roles={["staff", "admin"]}><StaffPage /></RequireAuth>} />
        <Route path="/admin" element={<RequireAuth roles={["admin"]}><AdminPage /></RequireAuth>} />
      </Routes>
      <Footer />
      <Assistant />
    </>
  );
}
