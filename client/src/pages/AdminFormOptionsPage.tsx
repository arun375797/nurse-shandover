import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FORM_OPTION_CATEGORIES, type FormOptionCategory } from '@bedsiderelay/shared';
import {
  createAdminFormOption,
  deleteAdminFormOption,
  fetchAdminFormOptions,
  updateAdminFormOption,
} from '../api/admin';
import { AppFooter, AppHeader } from '../components/Layout';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useToast } from '../components/Toast';

export function AdminFormOptionsPage() {
  const { pushToast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState<FormOptionCategory>(
    FORM_OPTION_CATEGORIES[0].key,
  );
  const [newValue, setNewValue] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ['admin', 'form-options'],
    queryFn: fetchAdminFormOptions,
  });

  const categoryOptions = useMemo(
    () => query.data?.items.filter((opt) => opt.category === selectedCategory) ?? [],
    [query.data, selectedCategory],
  );

  const categoryLabel =
    FORM_OPTION_CATEGORIES.find((c) => c.key === selectedCategory)?.label ?? selectedCategory;

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['admin', 'form-options'] });
    void queryClient.invalidateQueries({ queryKey: ['form-options'] });
  };

  const createOption = useMutation({
    mutationFn: () =>
      createAdminFormOption({
        category: selectedCategory,
        value: newValue.trim(),
        sortOrder: categoryOptions.length,
      }),
    onSuccess: () => {
      setNewValue('');
      invalidate();
      pushToast('Option added.', 'success');
    },
    onError: (err: Error) => pushToast(err.message || 'Unable to add option.', 'error'),
  });

  const saveEdit = useMutation({
    mutationFn: ({ id, value }: { id: string; value: string }) =>
      updateAdminFormOption(id, { value: value.trim() }),
    onSuccess: () => {
      setEditingId(null);
      setEditValue('');
      invalidate();
      pushToast('Option updated.', 'success');
    },
    onError: (err: Error) => pushToast(err.message || 'Unable to update option.', 'error'),
  });

  const toggleActive = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      updateAdminFormOption(id, { active }),
    onSuccess: () => {
      invalidate();
      pushToast('Option status updated.', 'success');
    },
    onError: (err: Error) => pushToast(err.message || 'Unable to update option.', 'error'),
  });

  const removeOption = useMutation({
    mutationFn: (id: string) => deleteAdminFormOption(id),
    onSuccess: () => {
      setDeleteId(null);
      invalidate();
      pushToast('Option deleted.', 'success');
    },
    onError: (err: Error) => pushToast(err.message || 'Unable to delete option.', 'error'),
  });

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6">
        <div>
          <h1 className="font-display text-3xl font-bold text-navy-900">Form Options</h1>
          <p className="mt-1 text-slate-600">
            Manage dropdown suggestions on the nurse handover form — test names, units, infusion
            types, and more.
          </p>
        </div>

        <div className="mt-6">
          <label htmlFor="category" className="field-label">
            Category
          </label>
          <select
            id="category"
            className="field-input max-w-md"
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value as FormOptionCategory);
              setEditingId(null);
              setNewValue('');
            }}
          >
            {FORM_OPTION_CATEGORIES.map((cat) => (
              <option key={cat.key} value={cat.key}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-6 rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="font-semibold text-navy-900">{categoryLabel}</h2>

          <form
            className="mt-4 flex flex-wrap gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (!newValue.trim()) return;
              createOption.mutate();
            }}
          >
            <input
              className="field-input min-w-[200px] flex-1"
              placeholder="Add new option…"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
            />
            <button
              type="submit"
              className="btn-primary"
              disabled={!newValue.trim() || createOption.isPending}
            >
              Add
            </button>
          </form>

          {query.isLoading && <p className="mt-4 text-slate-600">Loading options…</p>}

          {query.data && (
            <ul className="mt-4 divide-y divide-slate-100">
              {categoryOptions.length === 0 && (
                <li className="py-4 text-sm text-slate-500">No options in this category yet.</li>
              )}
              {categoryOptions.map((opt) => (
                <li key={opt.id} className="flex flex-wrap items-center gap-3 py-3">
                  {editingId === opt.id ? (
                    <>
                      <input
                        className="field-input min-w-[200px] flex-1"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        autoFocus
                      />
                      <button
                        type="button"
                        className="btn-primary text-sm"
                        disabled={!editValue.trim() || saveEdit.isPending}
                        onClick={() => saveEdit.mutate({ id: opt.id, value: editValue })}
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        className="btn-secondary text-sm"
                        onClick={() => {
                          setEditingId(null);
                          setEditValue('');
                        }}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <span
                        className={`flex-1 font-medium ${opt.active ? 'text-navy-900' : 'text-slate-400 line-through'}`}
                      >
                        {opt.value}
                      </span>
                      <button
                        type="button"
                        className="btn-secondary text-sm"
                        onClick={() => {
                          setEditingId(opt.id);
                          setEditValue(opt.value);
                        }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="btn-secondary text-sm"
                        disabled={toggleActive.isPending}
                        onClick={() => toggleActive.mutate({ id: opt.id, active: !opt.active })}
                      >
                        {opt.active ? 'Disable' : 'Enable'}
                      </button>
                      <button
                        type="button"
                        className="btn-danger text-sm"
                        onClick={() => setDeleteId(opt.id)}
                      >
                        Delete
                      </button>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
      <AppFooter />

      <ConfirmDialog
        open={deleteId !== null}
        title="Delete option?"
        message="This removes the option from nurse form suggestions. Existing handover records are not changed."
        confirmLabel="Delete"
        destructive
        onConfirm={() => deleteId && removeOption.mutate(deleteId)}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
