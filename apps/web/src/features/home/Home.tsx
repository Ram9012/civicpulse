import { Link } from "react-router-dom";

export default function Home() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-16 text-center">
      <h1 className="text-3xl font-bold sm:text-4xl">See a problem in your city? Report it.</h1>
      <p className="mt-3 text-slate-600">Snap a photo, drop a pin, and follow the fix from start to finish.</p>
      <Link
        to="/report"
        className="mt-8 inline-flex min-h-12 items-center rounded-lg bg-teal-700 px-6 text-lg font-medium text-white"
      >
        Report an issue
      </Link>
      <p className="mt-4">
        <Link to="/explore" className="text-teal-700 underline">
          Browse reports near you
        </Link>
      </p>
    </main>
  );
}
