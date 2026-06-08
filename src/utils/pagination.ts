/**
 * Pagination Utility
 * Shared helpers for building paginated responses and extracting pagination params.
 */

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

/**
 * Extract and validate pagination parameters from a raw query object.
 */
export const getPaginationParams = (
  query: { page?: string | number; limit?: string | number }
): PaginationParams => {
  const page = Math.max(1, parseInt(String(query.page || '1'), 10));
  const limit = Math.min(100, Math.max(1, parseInt(String(query.limit || '10'), 10)));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

/**
 * Build a paginated response metadata object.
 */
export const buildPaginationMeta = (total: number, page: number, limit: number) => ({
  total,
  page,
  limit,
  totalPages: Math.ceil(total / limit),
  hasNextPage: page * limit < total,
  hasPrevPage: page > 1,
});
