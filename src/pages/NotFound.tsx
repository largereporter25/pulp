import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="studio-bg grain min-h-screen flex flex-col items-center justify-center text-center px-6">
      <div className="text-7xl font-serif text-amber-glow mb-4">404</div>
      <p className="text-ink-600 mb-8">This scene didn't make the final cut.</p>
      <Link href="/" className="btn-press rounded-full bg-amber-glow px-6 py-2.5 font-medium text-ink-950">
        Back to your library
      </Link>
    </div>
  );
}
