import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { extractErrorMessage } from "../lib/api";
import { Input } from "../components/common/Input";
import { Button } from "../components/common/Button";
import { Card } from "../components/common/Card";

interface FormValues {
  email: string;
  password: string;
}

export default function Login() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>();

  if (user) return <Navigate to="/dashboard" replace />;

  async function onSubmit(values: FormValues) {
    setError(null);
    try {
      await login(values.email, values.password);
      navigate("/dashboard");
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <Card className="w-full max-w-sm">
        <h1 className="mb-1 text-2xl font-bold text-brand">TravelFlow</h1>
        <p className="mb-6 text-sm text-slate-500">Log in to your agent dashboard</p>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Input
            label="Email"
            type="email"
            placeholder="agent@example.com"
            error={errors.email?.message}
            {...register("email", { required: "Email is required" })}
          />
          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            error={errors.password?.message}
            {...register("password", { required: "Password is required" })}
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button type="submit" isLoading={isSubmitting} className="mt-2 w-full">
            Log in
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          No account?{" "}
          <Link to="/signup" className="font-medium text-brand hover:underline">
            Sign up
          </Link>
        </p>

        <p className="mt-4 rounded-lg bg-slate-50 p-3 text-xs text-slate-400">
          Demo login: <span className="font-mono">demo@travelflow.app</span> / <span className="font-mono">demo1234</span>
        </p>
      </Card>
    </div>
  );
}
