import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

const DEFAULTS = {
  type: 'sell',
  q: '',
  sort: 'newest',
  page: '1',
  limit: '12',
  categoryLevel3: '',
  status: 'active',
};

export default function useMarketplaceFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = useMemo(() => {
    const type = searchParams.get('type') || DEFAULTS.type;
    return {
      type,
      q: searchParams.get('q') || DEFAULTS.q,
      sort: searchParams.get('sort') || DEFAULTS.sort,
      page: searchParams.get('page') || DEFAULTS.page,
      limit: searchParams.get('limit') || DEFAULTS.limit,
      categoryLevel3: searchParams.get('categoryLevel3') || DEFAULTS.categoryLevel3,
      status: searchParams.get('status') || DEFAULTS.status,
    };
  }, [searchParams]);

  const setFilter = (key, value) => {
    const params = new URLSearchParams(searchParams);

    if (value === undefined || value === null || value === '') {
      params.delete(key);
    } else {
      params.set(key, String(value));
    }

    if (key !== 'page') {
      params.set('page', '1');
    }

    setSearchParams(params, { replace: true });
  };

  const setFilters = (nextFilters = {}) => {
    const params = new URLSearchParams(searchParams);

    Object.entries(nextFilters).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') {
        params.delete(key);
      } else {
        params.set(key, String(value));
      }
    });

    if (!('page' in nextFilters)) {
      params.set('page', '1');
    }

    setSearchParams(params, { replace: true });
  };

  const resetFilters = () => {
    setSearchParams(
      {
        type: filters.type || DEFAULTS.type,
        sort: DEFAULTS.sort,
        page: DEFAULTS.page,
        limit: DEFAULTS.limit,
        status: DEFAULTS.status,
      },
      { replace: true }
    );
  };

  return {
    filters,
    setFilter,
    setFilters,
    resetFilters,
    searchParams,
  };
}