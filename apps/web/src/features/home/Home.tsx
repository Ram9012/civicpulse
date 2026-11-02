import { Link } from "react-router-dom";
import { useI18n } from "../../lib/i18n";

export default function Home() {
  const { t } = useI18n();
  return (
    <main className="mx-auto max-w-2xl px-4 py-16 text-center">
      <h1 className="text-3xl font-bold sm:text-4xl">{t("home.title")}</h1>
      <p className="mt-3 text-slate-600">{t("home.sub")}</p>
      <Link
        to="/report"
        className="mt-8 inline-flex min-h-12 items-center rounded-lg bg-teal-700 px-6 text-lg font-medium text-white"
      >
        {t("home.cta")}
      </Link>
      <p className="mt-4">
        <Link to="/explore" className="text-teal-700 underline">{t("home.browse")}</Link>
      </p>
    </main>
  );
}
