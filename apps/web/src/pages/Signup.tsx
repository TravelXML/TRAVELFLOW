import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { extractErrorMessage } from "../lib/api";
import { Input } from "../components/common/Input";
import { Button } from "../components/common/Button";
import { Card } from "../components/common/Card";

interface FormValues {
  name: string;
  email: string;
  password: string;
}

export default function Signup() {
  const { register: registerUser, user } = useAuth();
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
      await registerUser(values.email, values.password, values.name);
      navigate("/dashboard");
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <Card className="w-full max-w-sm">
        <h1 className="mb-1 text-2xl font-bold text-brand">TravelFlow</h1>
        <p className="mb-6 text-sm text-slate-500">Create your agent account</p>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Input label="Name" placeholder="Jane Agent" error={errors.name?.message} {...register("name", { required: "Name is required" })} />
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
            placeholder="At least 8 characters"
            error={errors.password?.message}
            {...register("password", { required: "Password is required", minLength: { value: 8, message: "At least 8 characters" } })}
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button type="submit" isLoading={isSubmitting} className="mt-2 w-full">
            Create account
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-brand hover:underline">
            Log in
          </Link>
        </p>
      </Card>
    </div>
  );
}
