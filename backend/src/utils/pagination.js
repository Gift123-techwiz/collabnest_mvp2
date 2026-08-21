const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 50;

function parsePagination(query = {}) {
  let page = parseInt(query.page, 10);
  let pageSize = parseInt(query.pageSize, 10);

  if (!Number.isInteger(page) || page < 1) page = DEFAULT_PAGE;
  if (!Number.isInteger(pageSize) || pageSize < 1) pageSize = DEFAULT_PAGE_SIZE;
  if (pageSize > MAX_PAGE_SIZE) pageSize = MAX_PAGE_SIZE;

  return { page, pageSize, skip: (page - 1) * pageSize, take: pageSize };
}

function buildPaginatedResponse(items, total, page, pageSize) {
  return {
    items,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    },
  };
}

module.exports = { parsePagination, buildPaginatedResponse };
