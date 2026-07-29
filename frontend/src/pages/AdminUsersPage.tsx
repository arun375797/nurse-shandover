import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchAdminUsers, updateAdminUser } from '../api/admin';
import { AppFooter, AppHeader } from '../components/Layout';
import { useToast } from '../components/Toast';
import { formatDateTime } from '../utils/format';
import { useAuth } from '../auth/AuthContext';

export function AdminUsersPage() {
  const { timezone, user: currentUser } = useAuth();
  const { pushToast } = useToast();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: fetchAdminUsers,
  });

  const toggleActive = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      updateAdminUser(id, { active }),
    onSuccess: (_data, vars) => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      pushToast(vars.active ? 'User unblocked.' : 'User blocked.', 'success');
    },
    onError: (err: Error) => {
      pushToast(err.message || 'Unable to update user.', 'error');
    },
  });

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6">
        <div>
          <h1 className="font-display text-3xl font-bold text-navy-900">User Management</h1>
          <p className="mt-1 text-slate-600">
            Block or unblock staff accounts and review usage activity. Patient details are not
            shown here.
          </p>
        </div>

        {query.isLoading && (
          <p className="mt-8 text-slate-600" role="status">
            Loading users…
          </p>
        )}

        {query.isError && (
          <p className="mt-8 text-red-700">Unable to load users. Please try again.</p>
        )}

        {query.data && (
          <div className="mt-6 overflow-x-auto rounded-lg border border-slate-200 bg-white">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-navy-800">
                <tr>
                  <th className="px-4 py-3 font-semibold">Name</th>
                  <th className="px-4 py-3 font-semibold">Email</th>
                  <th className="px-4 py-3 font-semibold">Role</th>
                  <th className="px-4 py-3 font-semibold">Unit</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Last login</th>
                  <th className="px-4 py-3 font-semibold">Usage</th>
                  <th className="px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {query.data.items.map((user) => {
                  const isSelf = user.id === currentUser?.id;
                  return (
                    <tr key={user.id} className="border-b border-slate-100 last:border-0">
                      <td className="px-4 py-3 font-medium">{user.fullName}</td>
                      <td className="px-4 py-3 text-slate-600">{user.email}</td>
                      <td className="px-4 py-3 capitalize">{user.role}</td>
                      <td className="px-4 py-3">{user.unit?.name ?? '—'}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            user.active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {user.active ? 'Active' : 'Blocked'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {user.lastLoginAt
                          ? formatDateTime(user.lastLoginAt, timezone)
                          : 'Never'}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        <div className="space-y-0.5 text-xs">
                          <p>Logins: {user.usage.loginCount}</p>
                          <p>Created: {user.usage.handoverCreateCount}</p>
                          <p>Updated: {user.usage.handoverUpdateCount}</p>
                          <p>Acknowledged: {user.usage.acknowledgeCount}</p>
                          {user.usage.lastActivityAt && (
                            <p className="text-slate-500">
                              Last active:{' '}
                              {formatDateTime(user.usage.lastActivityAt, timezone)}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {isSelf ? (
                          <span className="text-xs text-slate-500">You</span>
                        ) : (
                          <button
                            type="button"
                            className={user.active ? 'btn-danger text-sm' : 'btn-primary text-sm'}
                            disabled={toggleActive.isPending}
                            onClick={() =>
                              toggleActive.mutate({ id: user.id, active: !user.active })
                            }
                          >
                            {user.active ? 'Block' : 'Unblock'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
      <AppFooter />
    </div>
  );
}
