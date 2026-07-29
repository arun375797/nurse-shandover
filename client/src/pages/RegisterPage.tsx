import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { registerSchema } from '@bedsiderelay/shared';
import { useAuth } from '../auth/AuthContext';
import { ApiError } from '../api/client';
import { fetchUnits, register as registerNurse } from '../api/patients';
import { useState } from 'react';
import { AuthShell } from '../components/AuthShell';
import { AppDisclaimer } from '../components/Layout';

type RegisterForm = z.infer<typeof registerSchema>;

export function RegisterPage() {
  const { isAuthenticated, isLoading, login } = useAuth();
  const navigate = useNavigate();
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const unitsQuery = useQuery({
    queryKey: ['units'],
    queryFn: fetchUnits,
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      unitName: '',
      password: '',
      confirmPassword: '',
    },
  });

  if (!isLoading && isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <AuthShell
      subtitle="Create your nurse account"
      footer={<AppDisclaimer />}
    >
      <form
        className="space-y-4"
        onSubmit={handleSubmit(async (values) => {
          setFormError(null);
          setSuccessMessage(null);
          try {
            const result = await registerNurse(values);
            setSuccessMessage(result.message);
            // Sign in immediately so the password typed on this form is used once.
            await login(values.email.trim(), values.password);
            navigate('/', { replace: true });
          } catch (err) {
            if (err instanceof ApiError && err.code === 'EMAIL_EXISTS') {
              setFormError(
                'An account with this email already exists. Sign in with the password you used when you registered.',
              );
              return;
            }
            setFormError(
              err instanceof ApiError ? err.message : 'Unable to register. Please try again.',
            );
          }
        })}
        noValidate
      >
        <div>
          <label htmlFor="fullName" className="field-label">
            Full name
          </label>
          <input
            id="fullName"
            type="text"
            autoComplete="name"
            className="field-input"
            {...register('fullName')}
          />
          {errors.fullName ? <p className="field-error">{errors.fullName.message}</p> : null}
        </div>
        <div>
          <label htmlFor="email" className="field-label">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            className="field-input"
            {...register('email')}
          />
          {errors.email ? <p className="field-error">{errors.email.message}</p> : null}
        </div>
        <div>
          <label htmlFor="unitName" className="field-label">
            Unit
          </label>
          <input
            id="unitName"
            type="text"
            list="unit-suggestions"
            autoComplete="organization"
            placeholder="e.g. Intensive Care Unit A"
            className="field-input"
            {...register('unitName')}
          />
          <datalist id="unit-suggestions">
            {unitsQuery.data?.items.map((unit) => (
              <option key={unit.id} value={unit.name} />
            ))}
          </datalist>
          <p className="mt-1 text-xs text-slate-500">
            Type your unit name or pick a suggestion.
          </p>
          {errors.unitName ? <p className="field-error">{errors.unitName.message}</p> : null}
        </div>
        <div>
          <label htmlFor="password" className="field-label">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            className="field-input"
            {...register('password')}
          />
          {errors.password ? <p className="field-error">{errors.password.message}</p> : null}
        </div>
        <div>
          <label htmlFor="confirmPassword" className="field-label">
            Confirm password
          </label>
          <input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            className="field-input"
            {...register('confirmPassword')}
          />
          {errors.confirmPassword ? (
            <p className="field-error">{errors.confirmPassword.message}</p>
          ) : null}
        </div>
        {formError ? (
          <p
            className="rounded-lg border border-red-300 bg-red-50 px-3 py-2.5 text-sm text-red-800"
            role="alert"
          >
            {formError}
          </p>
        ) : null}
        {successMessage ? (
          <p
            className="rounded-lg border border-green-300 bg-green-50 px-3 py-2.5 text-sm text-green-800"
            role="status"
          >
            {successMessage}
          </p>
        ) : null}
        <button type="submit" className="btn-primary w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Creating account…' : 'Register'}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-600">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-teal-700 hover:text-teal-800">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
