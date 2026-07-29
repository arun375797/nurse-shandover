import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { HomePage } from '../pages/HomePage';
import { AuthProvider } from '../auth/AuthContext';
import { ToastProvider } from '../components/Toast';
import { CreatableCombobox } from '../components/CreatableCombobox';
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

function renderWithProviders(ui: React.ReactNode, route = '/') {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <AuthProvider>
        <ToastProvider>
          <MemoryRouter initialEntries={[route]}>
            <Routes>
              <Route path="/" element={ui} />
              <Route path="/patients/new" element={<div>New Patient Route</div>} />
              <Route path="/patients/:id" element={<PatientFormPage />} />
              <Route path="/login" element={<div>Login</div>} />
            </Routes>
          </MemoryRouter>
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.restoreAllMocks();
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/api/auth/me')) {
        return new Response(JSON.stringify(nurse), { status: 200 });
      }
      if (url.includes('/api/auth/csrf-token')) {
        return new Response(JSON.stringify({ csrfToken: 'test-csrf' }), { status: 200 });
      }
      if (url.includes('/api/patients?') || url.endsWith('/api/patients')) {
        return new Response(
          JSON.stringify({ items: [], page: 1, limit: 10, total: 0, totalPages: 1 }),
          { status: 200 },
        );
      }
      return new Response(JSON.stringify({ error: { code: 'NOT_FOUND', message: 'missing' } }), {
        status: 404,
      });
    }),
  );
});

afterEach(() => {
  cleanup();
});

describe('HomePage', () => {
  it('shows loading then empty state', async () => {
    renderWithProviders(<HomePage />);
    expect(screen.getByRole('status')).toHaveTextContent(/Loading patients/i);
    await waitFor(() => {
      expect(screen.getByText(/No active patients yet/i)).toBeInTheDocument();
    });
  });

  it('shows populated patients and navigates on Add Patient', async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes('/api/auth/me')) {
          return new Response(JSON.stringify(nurse), { status: 200 });
        }
        if (url.includes('/api/patients')) {
          return new Response(
            JSON.stringify({
              items: [
                {
                  id: '333333333333333333333333',
                  patientName: 'Synthetic Patient Home',
                  mrNumberDisplay: 'SYN-HOME',
                  ward: 'ICU',
                  shift: 'Day',
                  status: 'ready',
                  updatedAt: new Date().toISOString(),
                },
              ],
              page: 1,
              limit: 10,
              total: 1,
              totalPages: 1,
            }),
            { status: 200 },
          );
        }
        return new Response('{}', { status: 200 });
      }),
    );

    renderWithProviders(<HomePage />);
    expect((await screen.findAllByText('Synthetic Patient Home')).length).toBeGreaterThan(0);
    expect(screen.getAllByText('SYN-HOME').length).toBeGreaterThan(0);
    await user.click(screen.getAllByRole('button', { name: /\+ Add Patient/i })[0]!);
    expect(await screen.findByText('New Patient Route')).toBeInTheDocument();
  });

  it('shows retryable error state', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes('/api/auth/me')) {
          return new Response(JSON.stringify(nurse), { status: 200 });
        }
        if (url.includes('/api/patients')) {
          return new Response(
            JSON.stringify({ error: { code: 'INTERNAL', message: 'fail' } }),
            { status: 500 },
          );
        }
        return new Response('{}', { status: 200 });
      }),
    );
    renderWithProviders(<HomePage />);
    expect(await screen.findByRole('alert')).toHaveTextContent(/Unable to load patients/i);
    expect(screen.getByRole('button', { name: /Retry/i })).toBeInTheDocument();
  });
});

describe('CreatableCombobox', () => {
  it('selects a suggested option', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <CreatableCombobox label="Sex" options={['Female', 'Male']} value="" onChange={onChange} />,
    );
    await user.click(screen.getByRole('combobox', { name: /Sex/i }));
    await user.click(screen.getByRole('option', { name: 'Female' }));
    expect(onChange).toHaveBeenCalledWith('Female');
  });

  it('allows custom entry', async () => {
    const user = userEvent.setup();
    function Harness() {
      const [value, setValue] = useState('');
      return (
        <CreatableCombobox
          label="Acuity"
          options={['Low', 'High']}
          value={value}
          onChange={setValue}
        />
      );
    }
    render(<Harness />);
    const input = screen.getByRole('combobox', { name: /Acuity/i });
    await user.type(input, 'CustomLevel');
    await user.keyboard('{ArrowDown}{Enter}');
    expect(input).toHaveValue('CustomLevel');
  });
});
