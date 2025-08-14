# PrimeNG Table State Helper - Developer Guide

This guide provides detailed information for developers working on the PrimeNG Table State Helper library.

## Project Structure

```
src/
├── index.ts                   # Main exports
├── table-state-helper.ts      # Core table state management classes
├── table-utils.ts             # Table configuration utilities
├── memoized-data-storage.ts   # Memoized data storage class
└── types.ts                   # Utility types and interfaces

usage/                         # Example implementation files
├── igmt4-process-data-bank-table.component.html
└── igmt4-process-data-bank-table.component.ts

example-usage.ts               # Table state examples
example-usage-complete.ts      # Complete examples with all features
README.md                      # User documentation
DEVELOPER-GUIDE.md            # This file
package.json                  # Package configuration
tsconfig.json                 # TypeScript configuration
tsup.config.ts                # Build configuration
```

## Architecture Overview

### Core Components

1. **PrimeNgDynamicTableStateHelper**: Advanced table state management with filtering and sorting
2. **PrimengPagedDataTableStateHelper**: Simple paged table state management
3. **MemoizedDataStorage**: HTTP data caching with memoization
4. **Utility Functions**: Helper functions for creating table configurations and managing data
3. **Type Definitions**: TypeScript interfaces for strong typing

### State Management

The library uses NgRx Signals for reactive state management:

```typescript
interface PrimeNgTableState<T> {
  data: Array<T>;
  isLoading: boolean;
  size: number;
  page: number;
  totalRecords: number;
  filter: DynamicQueryFilterDto[];
  sort: DynamicQuerySortDto[];
}
```

### API Integration

The helper expects a specific API contract:

**Request Format (POST)**:
```typescript
{
  size: number;          // Page size
  page: number;          // Current page (1-based)
  filter: Array<{
    field: string;       // Field to filter
    value: string;       // Filter value
    type: string;        // Filter operation
  }>;
  sort: Array<{
    field: string;       // Field to sort
    dir: 'asc' | 'desc'; // Sort direction
  }>;
}
```

**Response Format**:
```typescript
{
  data: T[];           // Array of records
  last_page: number;   // Total pages
  last_row: number;    // Total records
}
```

## Development Setup

### Prerequisites

- Node.js 18+
- npm or yarn
- TypeScript knowledge
- Angular and PrimeNG familiarity

### Local Development

1. **Clone and Install**:
   ```bash
   git clone <repository-url>
   cd primeng-table-state-helper
   npm install
   ```

2. **Development Build**:
   ```bash
   npm run dev  # Watch mode
   ```

3. **Type Checking**:
   ```bash
   npm run type-check
   ```

4. **Production Build**:
   ```bash
   npm run build
   ```

### Testing Your Changes

Since this is a library package, test your changes by:

1. Building the package
2. Using `npm link` to link locally
3. Testing in a real Angular project with PrimeNG

## Code Style Guidelines

### TypeScript

- Use strict mode TypeScript
- Provide comprehensive type definitions
- Use generic types where appropriate
- Document all public APIs with JSDoc

### Function Design

- Prefer pure functions
- Use meaningful parameter names
- Provide default values for optional parameters
- Return typed objects/values

### Class Design

- Use readonly properties for public signals
- Private methods start with `#` or `private`
- Method chaining where appropriate
- Clear constructor parameters

## API Design Principles

### Fluent Interface

The main class supports method chaining:

```typescript
tableState
  .setUniqueKey('id')
  .setUrl('/api/data')
  .patchQueryParams({ active: true })
  .refreshData();
```

### Signal-Based Reactivity

Expose state as readonly signals:

```typescript
readonly data: Signal<Array<T>> = this.state.data;
readonly isLoading: Signal<boolean> = this.state.isLoading;
readonly totalRecords: Signal<number> = this.state.totalRecords;
```

### Utility-First Functions

Provide utility functions for common configurations:

```typescript
const textColumn = createTextColumn('name', 'Full Name', {
  placeholder: 'Search names...'
});
```

## Error Handling

### API Errors

```typescript
try {
  const response = await this.httpClient.post(url, data).toPromise();
  // Process response
} catch (error) {
  patchState(this.state, { data: [] });
  throw error; // Let consumer handle
}
```

### State Validation

```typescript
if (this.state.isLoading()) {
  return; // Prevent concurrent requests
}
```

## Performance Considerations

### Request Debouncing

The library relies on PrimeNG's built-in debouncing for filter changes.

### Memory Management

- Clean up subscriptions in components
- Reset state when changing URLs
- Use signals for reactive updates

### Bundle Size

- Tree-shakeable exports
- No runtime dependencies
- Minimal peer dependencies

## Testing Strategy

### Unit Tests

Test individual functions and classes:

```typescript
describe('PrimeNgTableStateHelper', () => {
  it('should create instance with correct initial state', () => {
    // Test implementation
  });
});
```

### Integration Tests

Test with actual Angular components and PrimeNG tables.

### Type Tests

Ensure TypeScript types work correctly:

```typescript
// Should compile without errors
const helper = PrimeNgTableStateHelper.create<User>({
  url: '/api/users',
  httpClient: mockHttpClient
});
```

## Release Process

### Version Management

Follow semantic versioning:
- **Major**: Breaking changes
- **Minor**: New features (backward compatible)
- **Patch**: Bug fixes

### Build Process

```bash
npm run build      # Create distribution files
npm run type-check # Verify TypeScript
```

### Publishing

```bash
npm publish --access public
```

## Common Patterns

### Basic Table Setup

```typescript
const tableState = PrimeNgTableStateHelper.create<DataType>({
  url: '/api/endpoint',
  httpClient: this.httpClient
});
```

### Dynamic URL Changes

```typescript
async switchEndpoint(newUrl: string) {
  this.tableState
    .setUrl(newUrl)
    .clearTableData(this.tableRef());
  
  await this.tableState.refreshData();
}
```

### Query Parameter Management

```typescript
// Add parameters
this.tableState.patchQueryParams({ status: 'active' });

// Remove parameters  
this.tableState.removeQueryParam('status');

// Replace all parameters
this.tableState.setQueryParams({ newParam: 'value' });
```

## Troubleshooting

### Common Issues

1. **Import Errors**: Ensure peer dependencies are installed
2. **Type Errors**: Check generic type parameters
3. **API Errors**: Verify request/response format
4. **State Issues**: Check signal reactivity

### Debug Mode

Add console logging to development builds:

```typescript
if (environment?.development) {
  console.log('Table state changed:', this.state());
}
```

## Contributing

### Pull Request Process

1. Fork the repository
2. Create feature branch
3. Make changes with tests
4. Update documentation
5. Submit pull request

### Code Review Checklist

- [ ] TypeScript types are correct
- [ ] Documentation is updated
- [ ] Examples work correctly
- [ ] No breaking changes (or properly versioned)
- [ ] Performance impact considered

## Future Enhancements

### Planned Features

- Custom filter operators
- Advanced sorting options
- Export functionality
- Caching strategies
- WebSocket integration

### Extension Points

The library is designed to be extensible:

- Custom filter mappers
- Custom state reducers
- Plugin architecture
- Custom HTTP interceptors
