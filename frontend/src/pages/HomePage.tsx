import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { HANDOVER_STATUSES, SHIFTS } from '@/shared';
import { fetchPatients } from '../api/patients';
import { AppFooter, AppHeader } from '../components/Layout';
import { StatusBadge } from '../components/StatusBadge';
import { useAuth } from '../auth/AuthContext';
import { formatDateTime, locationLabel, statusLabel } from '../utils/format';

export function HomePage() {
  const navigate = useNavigate();
  const { timezone } = useAuth();
  const [search, setSearch] = useState('');
  const [shift, setShift] = useState('');
  const [status, setStatus] = useState('');
  const [ward, setWard] = useState('');
  const [page, setPage] = useState(1);

  const query = useQuery({
    queryKey: ['patients', { search, shift, status, ward, page }],
    queryFn: () =>
      fetchPatients({
        search: search || undefined,
        shift: shift || undefined,
        status: status || undefined,
        ward: ward || undefined,
        page,
        limit: 10,
        sort: '-updatedAt',
      }),
  });

  const hasFilters = Boolean(search || shift || status || ward);
  const empty = query.data && query.data.total === 0 && !hasFilters;
  const noResults = query.data && query.data.total === 0 && hasFilters;

  const pages = useMemo(() => query.data?.totalPages ?? 1, [query.data]);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <AppHeader />
      <main className="page-shell flex-1">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="page-title">Patients</h1>
            <p className="page-subtitle">Active handovers for your assigned unit.</p>
          </div>
          <button
            type="button"
            className="btn-primary w-full shrink-0 sm:w-auto"
            onClick={() => navigate('/patients/new')}
          >
            + Add Patient
          </button>
        </div>

        {query.data && !query.isLoading ? (
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:max-w-xl">
            <div className="card-elevated col-span-2 p-4 sm:col-span-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Total patients
              </p>
              <p className="mt-1 font-display text-3xl font-bold text-navy-900">
                {query.data.total}
              </p>
            </div>
            <div className="card p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Page</p>
              <p className="mt-1 text-lg font-semibold text-navy-900">
                {query.data.page} <span className="text-slate-400">/</span> {pages}
              </p>
            </div>
          </div>
        ) : null}

        <div className="card-elevated mt-6 grid gap-4 p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-4">
          <div className="sm:col-span-2">
            <label htmlFor="search" className="field-label">
              Search by name or MR number
            </label>
            <input
              id="search"
              className="field-input"
              value={search}
              onChange={(e) => {
                setPage(1);
                setSearch(e.target.value);
              }}
              placeholder="Name or MR number"
            />
          </div>
          <div>
            <label htmlFor="shift" className="field-label">
              Shift
            </label>
            <select
              id="shift"
              className="field-input"
              value={shift}
              onChange={(e) => {
                setPage(1);
                setShift(e.target.value);
              }}
            >
              <option value="">All shifts</option>
              {SHIFTS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="status" className="field-label">
              Status
            </label>
            <select
              id="status"
              className="field-input"
              value={status}
              onChange={(e) => {
                setPage(1);
                setStatus(e.target.value);
              }}
            >
              <option value="">Active statuses</option>
              {HANDOVER_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {statusLabel(s)}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2 lg:col-span-4">
            <label htmlFor="ward" className="field-label">
              Ward
            </label>
            <input
              id="ward"
              className="field-input"
              value={ward}
              onChange={(e) => {
                setPage(1);
                setWard(e.target.value);
              }}
              placeholder="Filter by ward"
            />
          </div>
        </div>

        <div className="mt-6">
          {query.isLoading ? (
            <div className="card-elevated p-8 text-center text-slate-600" role="status">
              Loading patients…
            </div>
          ) : null}

          {query.isError ? (
            <div
              className="rounded-xl border border-red-300 bg-red-50 p-6 text-red-800 sm:p-8"
              role="alert"
            >
              <p className="font-semibold">Unable to load patients.</p>
              <button type="button" className="btn-secondary mt-4" onClick={() => void query.refetch()}>
                Retry
              </button>
            </div>
          ) : null}

          {empty ? (
            <div className="card-elevated border-dashed p-8 text-center sm:p-12">
              <p className="text-lg font-semibold text-navy-900">No active patients yet</p>
              <p className="mt-2 text-slate-600">Add a patient handover to get started.</p>
              <button
                type="button"
                className="btn-primary mt-6 w-full sm:w-auto"
                onClick={() => navigate('/patients/new')}
              >
                + Add Patient
              </button>
            </div>
          ) : null}

          {noResults ? (
            <div className="card-elevated p-8 text-center text-slate-700">
              No patients match your search or filters.
            </div>
          ) : null}

          {query.data && query.data.items.length > 0 ? (
            <>
              <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card md:block">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-600">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Patient</th>
                        <th className="px-4 py-3 font-semibold">MR Number</th>
                        <th className="px-4 py-3 font-semibold">Location</th>
                        <th className="px-4 py-3 font-semibold">Shift</th>
                        <th className="px-4 py-3 font-semibold">Status</th>
                        <th className="px-4 py-3 font-semibold">Updated</th>
                        <th className="px-4 py-3">
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {query.data.items.map((patient) => (
                        <tr key={patient.id} className="hover:bg-slate-50/80">
                          <td className="px-4 py-3.5 font-semibold text-navy-900">
                            <Link
                              to={`/patients/${patient.id}`}
                              className="hover:text-teal-700 hover:underline"
                            >
                              {patient.patientName}
                            </Link>
                          </td>
                          <td className="px-4 py-3.5 text-slate-700">{patient.mrNumberDisplay}</td>
                          <td className="px-4 py-3.5 text-slate-700">{locationLabel(patient)}</td>
                          <td className="px-4 py-3.5 text-slate-700">{patient.shift || '—'}</td>
                          <td className="px-4 py-3.5">
                            <StatusBadge status={patient.status} />
                          </td>
                          <td className="px-4 py-3.5 text-slate-700">
                            {formatDateTime(patient.updatedAt, timezone)}
                          </td>
                          <td className="px-4 py-3.5">
                            <Link to={`/patients/${patient.id}`} className="btn-secondary text-sm">
                              Open
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="grid gap-3 md:hidden">
                {query.data.items.map((patient) => (
                  <article key={patient.id} className="card-elevated p-4">
                    <div className="flex items-start justify-between gap-3">
                      <h2 className="text-lg font-bold text-navy-900">
                        <Link to={`/patients/${patient.id}`} className="hover:text-teal-700">
                          {patient.patientName}
                        </Link>
                      </h2>
                      <StatusBadge status={patient.status} />
                    </div>
                    <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                      <div>
                        <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                          MR Number
                        </dt>
                        <dd className="mt-0.5 font-medium text-slate-800">{patient.mrNumberDisplay}</dd>
                      </div>
                      <div>
                        <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                          Shift
                        </dt>
                        <dd className="mt-0.5 font-medium text-slate-800">{patient.shift || '—'}</dd>
                      </div>
                      <div className="col-span-2">
                        <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                          Location
                        </dt>
                        <dd className="mt-0.5 font-medium text-slate-800">{locationLabel(patient)}</dd>
                      </div>
                      <div className="col-span-2">
                        <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                          Updated
                        </dt>
                        <dd className="mt-0.5 font-medium text-slate-800">
                          {formatDateTime(patient.updatedAt, timezone)}
                        </dd>
                      </div>
                    </dl>
                    <Link
                      to={`/patients/${patient.id}`}
                      className="btn-secondary mt-4 flex w-full justify-center"
                    >
                      Open handover
                    </Link>
                  </article>
                ))}
              </div>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-center text-sm text-slate-600 sm:text-left">
                  Page {query.data.page} of {pages} · {query.data.total} patients
                </p>
                <div className="grid grid-cols-2 gap-2 sm:flex">
                  <button
                    type="button"
                    className="btn-secondary w-full"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    className="btn-secondary w-full"
                    disabled={page >= pages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </main>
      <AppFooter />
    </div>
  );
}
