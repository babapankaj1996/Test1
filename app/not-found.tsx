import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-24">
      <div className="glass max-w-md rounded-3xl p-10 text-center">
        <p className="font-display gradient-text text-6xl font-bold">404</p>
        <h1 className="font-display mt-4 text-2xl font-bold">Lost in space</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          The page you&apos;re looking for doesn&apos;t exist, was moved, or drifted out of orbit.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/" className="btn-primary">
            Go home
          </Link>
          <Link href="/trending" className="btn-ghost">
            Trending posts
          </Link>
        </div>
      </div>
    </div>
  );
}
