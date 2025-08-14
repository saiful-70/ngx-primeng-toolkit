/**
 * @deprecated This file is deprecated. Use the separated helpers instead:
 * - PrimeNgDynamicTableStateHelper from './dynamic-table-state-helper'
 * - PrimengPagedDataTableStateHelper from './paged-table-state-helper'
 * 
 * This file is kept for backward compatibility and will be removed in future versions.
 */

// Re-export the separated helpers for backward compatibility
export { PrimeNgDynamicTableStateHelper } from './dynamic-table-state-helper';
export { PrimengPagedDataTableStateHelper } from './paged-table-state-helper';

// Re-export types that were previously in this file (now in types.ts and table-utils.ts)
export * from './types';
export * from './table-utils';

// Legacy alias exports
export { PrimeNgDynamicTableStateHelper as PrimeNgTableStateHelper } from './dynamic-table-state-helper';
