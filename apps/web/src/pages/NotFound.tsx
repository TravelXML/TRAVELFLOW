import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-2 text-center">
      <h1 className="text-4xl font-bold text-slate-900">404</h1>
      <p className="text-slate-500">Page not found</p>
      <Link to="/dashboard" className="text-brand hover:underline">
        Back to dashboard
      </Link>
    </div>
  );
}
