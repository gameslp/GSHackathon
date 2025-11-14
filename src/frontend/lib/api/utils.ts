type ApiResult<T> = {
  data?: T;
  error?: unknown;
  response?: Response;
};

/**
 * Normalizes Hey API responses by throwing an Error when the backend
 * returned a non-2xx status code.
 */
export function unwrapResponse<T>(result: ApiResult<T>): T {
  if (result && 'error' in result && result.error) {
    const status = result.response?.status;
    const message =
      typeof result.error === 'string'
        ? result.error
        : (result.error as Record<string, string | undefined>)?.error ||
          'Request failed';

    const error = new Error(message);
    (error as Error & { status?: number }).status = status;
    (error as Error & { details?: unknown }).details = result.error;
    throw error;
  }

  return result.data as T;
}
