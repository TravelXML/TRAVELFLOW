import { NavLink, Outlet } from "react-router-dom";
import clsx from "clsx";
import { useAuth } from "../../lib/auth";
import { Button } from "../common/Button";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/proposals", label: "Proposals" },
  { to: "/settings", label: "Settings" },
];

export function AppShell() {
  const { user, logout } = useAuth();

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-60 flex-col border-r border-slate-200 bg-white px-4 py-6">
        <div className="mb-8 px-2 text-xl font-bold text-brand">TravelFlow</div>
        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                clsx(
                  "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive ? "bg-brand/10 text-brand" : "text-slate-600 hover:bg-slate-100"
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto flex flex-col gap-2 border-t border-slate-200 pt-4">
          <div className="px-2 text-sm">
            <div className="font-medium text-slate-800">{user?.name}</div>
            <div className="text-slate-400">{user?.email}</div>
          </div>
          <Button variant="ghost" onClick={logout} className="justify-start">
            Log out
          </Button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto bg-slate-50 p-8">
        <Outlet />
      </main>
    </div>
  );
}
