import { HttpContextToken } from "@angular/common/http";

/**
 * HTTP Context Token to skip loading spinner on HTTP requests
 * Usage: Set this token to true in HttpContext to skip showing loading spinner
 * 
 * @example
 * ```typescript
 * const context = new HttpContext().set(SkipLoadingSpinner, true);
 * this.httpClient.get('/api/data', { context });
 * ```
 */
export const SkipLoadingSpinner = new HttpContextToken(() => false);
