import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Navigate, Link, useNavigate } from 'react-router-dom';
import { loginSchema } from '@bedsiderelay/shared';
import { useAuth } from '../auth/AuthContext';
import { ApiError } from '../api/client';
import { useState } from 'react';
import { AuthShell } from '../components/AuthShell';
import { AppDisclaimer } from '../components/Layout';

type LoginForm = z.infer<typeof loginSchema>;

export function LoginPage() {
  const { login, isAuthenticated, isLoading, user } = useAuth();
  const navigate = useNavigate();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  if (!isLoading && isAuthenticated) {
    return <Navigate to={user?.role === 'admin' ? '/admin' : '/'} replace />;
  }

  return (
    <AuthShell
      subtitle="Clear shifts. Continuous care."
      footer={<AppDisclaimer />}
    >
      <form
        className="space-y-5"
        onSubmit={handleSubmit(async (values) => {
          setFormError(null);
          try {
            const session = await login(values.email, values.password);
            navigate(session.user.role === 'admin' ? '/admin' : '/', { replace: true });
          } catch (err) {
            setFormError(
              err instanceof ApiError ? err.message : 'Unable to sign in. Please try again.',
            );
          }
        })}
        noValidate
      >
        <div>
          <label htmlFor="email" className="field-label">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="username"
            className="field-input"
            {...register('email')}
          />
          {errors.email ? <p className="field-error">{errors.email.message}</p> : null}
        </div>
        <div>
          <label htmlFor="password" className="field-label">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            className="field-input"
            {...register('password')}
          />
          {errors.password ? <p className="field-error">{errors.password.message}</p> : null}
        </div>
        {formError ? (
          <p
            className="rounded-lg border border-red-300 bg-red-50 px-3 py-2.5 text-sm text-red-800"
            role="alert"
          >
            {formError}
          </p>
        ) : null}
        <button type="submit" className="btn-primary w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-600">
        New nurse?{' '}
        <Link to="/register" className="font-semibold text-teal-700 hover:text-teal-800">
          Register
        </Link>
      </p>
    </AuthShell>
  );
}
