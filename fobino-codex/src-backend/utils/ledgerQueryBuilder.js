function normalizeArrayParam(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeSort(sort) {
  const allowed = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    amount_desc: { grossAmount: -1, createdAt: -1 },
    amount_asc: { grossAmount: 1, createdAt: -1 },
  };

  return allowed[sort] || allowed.newest;
}

function buildLedgerQuery(userId, params = {}) {
  const {
    status,
    type,
    domain,
    flow,
    settlementStatus,
    startDate,
    endDate,
    isInformational,
    search,
  } = params;

  const query = {
    user: userId,
    visibleToUser: true,
  };

  const statuses = normalizeArrayParam(status);
  if (statuses.length === 1) {
    query.status = statuses[0];
  } else if (statuses.length > 1) {
    query.status = { $in: statuses };
  }

  const types = normalizeArrayParam(type);
  if (types.length === 1) {
    query.type = types[0];
  } else if (types.length > 1) {
    query.type = { $in: types };
  }

  const domains = normalizeArrayParam(domain);
  if (domains.length === 1) {
    query.domain = domains[0];
  } else if (domains.length > 1) {
    query.domain = { $in: domains };
  }

  const flows = normalizeArrayParam(flow);
  if (flows.length === 1) {
    query.flow = flows[0];
  } else if (flows.length > 1) {
    query.flow = { $in: flows };
  }

  const settlementStatuses = normalizeArrayParam(settlementStatus);
  if (settlementStatuses.length === 1) {
    query.settlementStatus = settlementStatuses[0];
  } else if (settlementStatuses.length > 1) {
    query.settlementStatus = { $in: settlementStatuses };
  }

  if (typeof isInformational !== 'undefined') {
    if (String(isInformational) === 'true') query.isInformational = true;
    if (String(isInformational) === 'false') query.isInformational = false;
  }

  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query.createdAt.$lte = end;
    }
  }

  if (search) {
    query.$or = [
      { transactionNumber: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { referenceId: { $regex: search, $options: 'i' } },
      { 'metadata.planName': { $regex: search, $options: 'i' } },
      { 'metadata.contractCode': { $regex: search, $options: 'i' } },
      { 'metadata.rfpCode': { $regex: search, $options: 'i' } },
      { 'display.title': { $regex: search, $options: 'i' } },
      { 'display.subtitle': { $regex: search, $options: 'i' } },
    ];
  }

  return query;
}

function buildLedgerOptions(params = {}) {
  const page = Math.max(Number(params.page) || 1, 1);
  const limit = Math.min(Math.max(Number(params.limit) || 20, 1), 100);
  const sort = normalizeSort(params.sort);

  return {
    page,
    limit,
    skip: (page - 1) * limit,
    sort,
  };
}

function buildAppliedFilters(params = {}) {
  return {
    status: normalizeArrayParam(params.status),
    type: normalizeArrayParam(params.type),
    domain: normalizeArrayParam(params.domain),
    flow: normalizeArrayParam(params.flow),
    settlementStatus: normalizeArrayParam(params.settlementStatus),
    startDate: params.startDate || null,
    endDate: params.endDate || null,
    search: params.search || '',
    isInformational:
      typeof params.isInformational === 'undefined'
        ? null
        : String(params.isInformational) === 'true',
    sort: params.sort || 'newest',
  };
}

module.exports = {
  buildLedgerQuery,
  buildLedgerOptions,
  buildAppliedFilters,
};