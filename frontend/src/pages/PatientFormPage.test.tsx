import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '../auth/AuthContext';
import { ToastProvider } from '../components/Toast';
import { PatientFormPage } from '../pages/PatientFormPage';

const nurse = {
  user: {
    id: '111111111111111111111111',
    fullName: 'Dev Nurse',
    email: 'nurse.dev@bedsiderelay.local',
    role: 'nurse' as const,
    unitId: '222222222222222222222222',
  },
  unit: { id: '222222222222222222222222', name: 'ICU A', code: 'ICU-A' },
  timezone: 'UTC',
};

function renderForm(route: string) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <AuthProvider>
        <ToastProvider>
          <MemoryRouter initialEntries={[route]}>
            <Routes>
              <Route path="/" element={<div>Home Page</div>} />
              <Route path="/patients/new" element={<PatientFormPage />} />
              <Route path="/patients/:id" element={<PatientFormPage />} />
            </Routes>
          </MemoryRouter>
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.restoreAllMocks();
});

afterEach(() => {
  cleanup();
});

describe('PatientFormPage', () => {
  it('validates required fields', async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes('/api/auth/me')) return new Response(JSON.stringify(nurse), { status: 200 });
        if (url.includes('/csrf-token')) {
          return new Response(JSON.stringify({ csrfToken: 'csrf' }), { status: 200 });
        }
        return new Response('{}', { status: 200 });
      }),
    );

    renderForm('/patients/new');
    await screen.findByRole('heading', { name: /Add Patient Handover/i });
    await user.click(screen.getAllByRole('button', { name: /Save Patient/i })[0]!);
    expect(await screen.findByText(/Patient name is required/i)).toBeInTheDocument();
    expect(screen.getByText(/MR number is required/i)).toBeInTheDocument();
  });

  it('saves and redirects home', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.includes('/api/auth/me')) return new Response(JSON.stringify(nurse), { status: 200 });
      if (url.includes('/csrf-token')) {
        return new Response(JSON.stringify({ csrfToken: 'csrf' }), { status: 200 });
      }
      if (url.endsWith('/api/patients') && init?.method === 'POST') {
        return new Response(
          JSON.stringify({
            item: {
              id: '333333333333333333333333',
              patientName: 'Synthetic Save',
              mrNumberDisplay: 'SYN-SAVE',
              version: 1,
            },
          }),
          { status: 201 },
        );
      }
      return new Response('{}', { status: 200 });
    });
    vi.stubGlobal('fetch', fetchMock);

    renderForm('/patients/new');
    await screen.findByLabelText(/Patient Name/i);
    await user.type(screen.getByLabelText(/Patient Name/i), 'Synthetic Save');
    await user.type(screen.getByLabelText(/MR Number/i), 'SYN-SAVE');
    await user.click(screen.getAllByRole('button', { name: /Save Patient/i })[0]!);
    expect(await screen.findByText('Home Page')).toBeInTheDocument();
  });

  it('loads existing patient for edit', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes('/api/auth/me')) return new Response(JSON.stringify(nurse), { status: 200 });
        if (url.includes('/api/patients/333333333333333333333333')) {
          return new Response(
            JSON.stringify({
              item: {
                id: '333333333333333333333333',
                patientName: 'Synthetic Edit',
                mrNumberDisplay: 'SYN-EDIT',
                pendingItems: 'Labs',
                version: 2,
                status: 'ready',
                handoverStatus: 'ready',
                assessment: {},
                ventilation: {},
                vitalSigns: [],
                infusions: [],
                intakeOutput: [],
                diagnosticTests: [],
                bloodResults: [],
                microbiology: [],
                bloodProducts: [],
                linesDevices: [],
                updatedAt: new Date().toISOString(),
              },
            }),
            { status: 200 },
          );
        }
        return new Response('{}', { status: 200 });
      }),
    );

    renderForm('/patients/333333333333333333333333');
    await waitFor(() => {
      expect(screen.getByDisplayValue('Synthetic Edit')).toBeInTheDocument();
    });
    expect(screen.getByDisplayValue('SYN-EDIT')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Labs')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /Delete Patient/i }).length).toBeGreaterThan(0);
  });

  it('shows simultaneous-edit conflict message', async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        if (url.includes('/api/auth/me')) return new Response(JSON.stringify(nurse), { status: 200 });
        if (url.includes('/csrf-token')) {
          return new Response(JSON.stringify({ csrfToken: 'csrf' }), { status: 200 });
        }
        if (url.includes('/api/patients/333333333333333333333333') && init?.method === 'PATCH') {
          return new Response(
            JSON.stringify({
              error: {
                code: 'VERSION_CONFLICT',
                message:
                  'Another nurse saved a newer version of this handover. Reload to review their changes before editing again.',
              },
            }),
            { status: 409 },
          );
        }
        if (url.includes('/api/patients/333333333333333333333333')) {
          return new Response(
            JSON.stringify({
              item: {
                id: '333333333333333333333333',
                patientName: 'Synthetic Conflict',
                mrNumberDisplay: 'SYN-CF',
                version: 1,
                status: 'draft',
                handoverStatus: 'draft',
                assessment: {},
                ventilation: {},
                vitalSigns: [],
                infusions: [],
                intakeOutput: [],
                diagnosticTests: [],
                bloodResults: [],
                microbiology: [],
                bloodProducts: [],
                linesDevices: [],
                updatedAt: new Date().toISOString(),
              },
            }),
            { status: 200 },
          );
        }
        return new Response('{}', { status: 200 });
      }),
    );

    renderForm('/patients/333333333333333333333333');
    await screen.findByDisplayValue('Synthetic Conflict');
    await user.type(screen.getByLabelText(/Pending items/i), ' updated');
    await user.click(screen.getAllByRole('button', { name: /Save Patient/i })[0]!);
    expect(await screen.findByText(/Simultaneous edit conflict/i)).toBeInTheDocument();
  });

  it('shows delete confirmation with name and MR', async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes('/api/auth/me')) return new Response(JSON.stringify(nurse), { status: 200 });
        if (url.includes('/api/patients/333333333333333333333333')) {
          return new Response(
            JSON.stringify({
              item: {
                id: '333333333333333333333333',
                patientName: 'Synthetic Delete',
                mrNumberDisplay: 'SYN-DEL',
                version: 1,
                status: 'draft',
                handoverStatus: 'draft',
                assessment: {},
                ventilation: {},
                vitalSigns: [],
                infusions: [],
                intakeOutput: [],
                diagnosticTests: [],
                bloodResults: [],
                microbiology: [],
                bloodProducts: [],
                linesDevices: [],
                updatedAt: new Date().toISOString(),
              },
            }),
            { status: 200 },
          );
        }
        return new Response('{}', { status: 200 });
      }),
    );

    renderForm('/patients/333333333333333333333333');
    await screen.findByDisplayValue('Synthetic Delete');
    await user.click(screen.getAllByRole('button', { name: /Delete Patient/i })[0]!);
    expect(await screen.findByRole('dialog')).toHaveTextContent('Synthetic Delete');
    expect(screen.getByRole('dialog')).toHaveTextContent('SYN-DEL');
    expect(screen.getByRole('dialog')).toHaveTextContent(/permanently removed/i);
  });
});
