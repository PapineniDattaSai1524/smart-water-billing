import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-3 text-center motion-safe:animate-fade-in">
      <h1 className="text-4xl font-bold text-ocean-900 dark:text-white motion-safe:animate-slide-up">404</h1>
      <p className="text-ocean-500 dark:text-ocean-400 motion-safe:animate-slide-up" style={{ animationDelay: '60ms' }}>
        The page you&apos;re looking for doesn&apos;t exist.
      </p>
      <Link to="/dashboard" className="btn-primary mt-2 motion-safe:animate-slide-up" style={{ animationDelay: '120ms' }}>
        Back to Dashboard
      </Link>
    </div>
  );
}
