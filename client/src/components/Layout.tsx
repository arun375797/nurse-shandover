import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { Logo } from './Logo';

export function AppHeader() {
  const { user, unit, logout } = useAuth();
  const location = useLocation();
  const isAdmin = user?.role === 'admin';

  return (
    <header className="border-b border-slate-200 bg-navy-900 text-white">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-3">
        <div>
          <Link to={isAdmin ? '/admin' : '/'} aria-label="Nurse's Handover home">
            <Logo variant="dark" />
          </Link>
          <p className="text-sm text-slate-300">Clear shifts. Continuous care.</p>
        </div>
        <nav className="flex flex-wrap items-center gap-3 text-sm">
          {isAdmin && (
            <>
              <Link
                to="/admin"
                className={`rounded px-3 py-1.5 font-semibold transition-colors ${
                  location.pathname.startsWith('/admin') && !location.pathname.includes('form-options')
                    ? 'bg-teal-600 text-white'
                    : 'text-slate-200 hover:bg-navy-800'
                }`}
              >
                Users
              </Link>
              <Link
                to="/admin/form-options"
                className={`rounded px-3 py-1.5 font-semibold transition-colors ${
                  location.pathname.startsWith('/admin/form-options')
                    ? 'bg-teal-600 text-white'
                    : 'text-slate-200 hover:bg-navy-800'
                }`}
              >
                Form Options
              </Link>
            </>
          )}
          {!isAdmin && (
            <Link
              to="/"
              className={`rounded px-3 py-1.5 font-semibold transition-colors ${
                location.pathname === '/'
                  ? 'bg-teal-600 text-white'
                  : 'text-slate-200 hover:bg-navy-800'
              }`}
            >
              Patients
            </Link>
          )}
        </nav>
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <div>
            <p className="text-slate-300">Unit</p>
            <p className="font-semibold">{unit?.name ?? '—'}</p>
          </div>
          <div>
            <p className="text-slate-300">Signed in</p>
            <p className="font-semibold">{user?.fullName ?? '—'}</p>
          </div>
          <button type="button" className="btn-secondary" onClick={() => void logout()}>
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}

export function AppDisclaimer() {
  return (
    <>
      <p>Nurse&apos;s Handover records staff-entered handover information.</p>
      <p className="mt-1">
        Patient records are not retained long-term and are permanently deleted when removed by
        clinical staff.
      </p>
      <p className="mt-1">
        Follow your hospital&apos;s approved clinical and emergency procedures.
      </p>
    </>
  );
}

export function AppFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-4 text-sm text-slate-600">
        <AppDisclaimer />
      </div>
    </footer>
  );
}
