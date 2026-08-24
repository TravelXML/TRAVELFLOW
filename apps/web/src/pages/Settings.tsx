import { useAuth } from "../lib/auth";
import { Card, CardTitle } from "../components/common/Card";

export default function Settings() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500">Your account and subscription details</p>
      </div>

      <Card className="max-w-xl">
        <CardTitle>Account</CardTitle>
        <div className="mt-4 flex flex-col gap-3 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">Name</span>
            <span className="font-medium text-slate-900">{user.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Email</span>
            <span className="font-medium text-slate-900">{user.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Agency name</span>
            <span className="font-medium text-slate-900">{user.brandingAgencyName ?? "-"}</span>
          </div>
        </div>
      </Card>

      <Card className="max-w-xl">
        <CardTitle>Subscription</CardTitle>
        <div className="mt-4 flex flex-col gap-3 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">Plan</span>
            <span className="font-medium capitalize text-slate-900">{user.subscriptionTier}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Proposals this month</span>
            <span className="font-medium text-slate-900">
              {user.proposalsMonthCount} / {user.proposalsMonthLimit}
            </span>
          </div>
        </div>
      </Card>

      <p className="max-w-xl text-xs text-slate-400">
        Branding colors, logo upload, and affiliate ID editing can be added here once{" "}
        <code className="rounded bg-slate-100 px-1 py-0.5">PUT /api/settings</code> is wired up - the fields already exist on the
        user model.
      </p>
    </div>
  );
}
