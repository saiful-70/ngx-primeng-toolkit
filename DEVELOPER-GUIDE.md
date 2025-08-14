# NGX PrimeNG Toolkit - Developer Guide

This guide provides detailed information for developers working on the NGX PrimeNG Toolkit library.

## Project Structure

```
src/
├── index.ts                      # Main exports
├── component-data-storage.ts     # Component data storage utilities
├── component-state.ts            # Component state management
├── dynamic-table-state-helper.ts # Dynamic table state management
├── http-context-tokens.ts        # HTTP context tokens
├── memoized-data-storage.ts      # Memoized data storage class
├── ng-select-helper.ts           # NgSelect helper utilities
├── paged-table-state-helper.ts   # Simple paged table state
├── table-utils.ts               # Table configuration utilities
└── types.ts                     # Utility types and interfaces

examples/
└── comprehensive-usage.example.ts # Complete usage examples

README.md                        # User documentation
DEVELOPER-GUIDE.md              # This file
package.json                    # Package configuration
tsconfig.json                   # TypeScript configuration
tsup.config.ts                  # Build configuration
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
   cd ngx-primeng-toolkit
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
describe('PrimeNgDynamicTableStateHelper', () => {
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
const helper = PrimeNgDynamicTableStateHelper.create<User>({
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
const tableState = PrimeNgDynamicTableStateHelper.create<DataType>({
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

## Version Management & Release Process

This project uses automated semantic versioning based on commit message conventions. The GitHub Action automatically bumps versions and publishes to NPM based on your commit messages.

### Commit Message Conventions

The commit message format determines which version number gets bumped:

#### Major Version (Breaking Changes)
Use when you make incompatible API changes:

```bash
# Examples for MAJOR version bump (x.0.0)
git commit -m "major: remove deprecated table-state-helper class"
git commit -m "refactor: change PrimeNgTableState interface BREAKING CHANGE: removed isLoading property"
git commit -m "feat: new table API BREAKING CHANGE: completely new table configuration format"
```

**Keywords that trigger major version bump:**
- `major:` prefix
- `BREAKING CHANGE:` in commit message body

#### Minor Version (New Features)
Use when you add functionality in a backward-compatible manner:

```bash
# Examples for MINOR version bump (x.y.0)
git commit -m "feat: add new table column type support"
git commit -m "feature: implement advanced filtering options"
git commit -m "feat: add ng-select helper utilities"
```

**Keywords that trigger minor version bump:**
- `feat:` prefix
- `feature:` prefix

#### Patch Version (Bug Fixes)
Use when you make backward-compatible bug fixes:

```bash
# Examples for PATCH version bump (x.y.z)
git commit -m "fix: resolve table state loading issue"
git commit -m "patch: correct type definitions for table headers"
git commit -m "bug: fix memory leak in memoized data storage"
```

**Keywords that trigger patch version bump:**
- `fix:` prefix
- `patch:` prefix
- `bug:` prefix

#### No Version Bump
Other commit types won't trigger version bumps but are still good practice:

```bash
# These won't bump version but are recommended
git commit -m "docs: update README examples"
git commit -m "chore: update build dependencies"
git commit -m "style: fix code formatting"
git commit -m "test: add unit tests for table utils"
git commit -m "refactor: improve code organization without breaking changes"
```

### Release Workflow

1. **Make your changes** and test them locally
2. **Commit with appropriate message** using the conventions above
3. **Push to main branch** - this triggers the automated release process:
   - GitHub Action runs tests and builds the package
   - Analyzes your commit message to determine version bump type
   - Updates `package.json` version automatically
   - Publishes to NPM (if tests pass)
   - Creates a Git tag for the new version
   - Commits the version change back to the repository

### Example Development Workflow

```bash
# Start working on a new feature
git checkout -b feature/table-export

# Make your changes and commit with proper message
git commit -m "feat: add table data export functionality"

# Push your feature branch and create PR
git push origin feature/table-export

# After PR is approved and merged to main, the release happens automatically
# The system will bump minor version and publish to NPM
```

### Hotfix Workflow

```bash
# For urgent bug fixes
git checkout -b hotfix/critical-bug

# Fix the issue and commit
git commit -m "fix: resolve critical memory leak in table state"

# Push and merge to main for immediate patch release
git push origin hotfix/critical-bug
```

### Version History

Check the [releases page](https://github.com/saiful-70/ngx-primeng-toolkit/releases) to see version history and changelogs.

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
