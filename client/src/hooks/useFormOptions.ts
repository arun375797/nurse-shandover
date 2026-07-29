import { useQuery } from '@tanstack/react-query';
import {
  DEFAULT_FORM_OPTIONS,
  type FormOptionCategory,
} from '@bedsiderelay/shared';
import { fetchFormOptions } from '../api/admin';

export function useFormOptions() {
  const query = useQuery({
    queryKey: ['form-options'],
    queryFn: fetchFormOptions,
    staleTime: 5 * 60_000,
  });

  const getOptions = (category: FormOptionCategory): readonly string[] => {
    const fromApi = query.data?.options?.[category];
    if (fromApi && fromApi.length > 0) return fromApi;
    return DEFAULT_FORM_OPTIONS[category];
  };

  return {
    ...query,
    getOptions,
  };
}
