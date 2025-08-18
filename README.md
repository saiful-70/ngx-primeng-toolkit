# NGX PrimeNG Toolkit

A comprehensive TypeScript utility library for Angular component state management, including PrimeNG table helpers, ng-select integration, data storage, and HTTP caching utilities with NgRx Signals. Compatible with **Angular 19+** and **PrimeNG 19+** (optimized for Angular 20+ and PrimeNG 20+).

## ✨ Features

- 🏗️ **Table State Management** - PrimeNG table helpers with lazy loading, filtering, and sorting
- 🎛️ **NgSelect Integration** - Complete ng-select lifecycle with search & pagination
- 💾 **Data Storage** - Memoized HTTP caching and component data management
- 🎛️ **Component State** - Reactive state management for UI components
- 🛠️ **Utility Functions** - Helper functions and TypeScript utility types
- 📦 **Tree-shakeable** - Import only what you need
- 🔒 **Type Safe** - Full TypeScript support with strict type checking

## 🚀 Quick Start

### Installation

```bash
npm install ngx-primeng-toolkit
```

### Peer Dependencies

```bash
# Core dependencies (Angular 19+ supported, 20+ recommended)
npm install @angular/common@^19.0.0 @angular/core@^19.0.0 @ngrx/signals@^19.0.0 rxjs@^7.0.0

# UI library dependencies (choose what you need)
npm install primeng@^19.0.0        # For PrimeNG table helpers
npm install @ng-select/ng-select@^15.0.0  # For ng-select helpers

# Optional (for response validation)
npm install zod@^3.0.0
```

### Basic Usage

```typescript
import { Component, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { PrimeNgDynamicTableStateHelper } from 'ngx-primeng-toolkit';

interface User {
  id: number;
  name: string;
  email: string;
}

@Component({
  selector: 'app-user-table',
  template: `
    <p-table 
      [value]="tableState.data()"
      [lazy]="true"
      [loading]="tableState.isLoading()"
      [totalRecords]="tableState.totalRecords()"
      [paginator]="true"
      [rows]="10"
      (onLazyLoad)="tableState.onLazyLoad($event)">
      
      <ng-template pTemplate="header">
        <tr>
          <th pSortableColumn="name">Name</th>
          <th pSortableColumn="email">Email</th>
        </tr>
      </ng-template>
      
      <ng-template pTemplate="body" let-user>
        <tr>
          <td>{{ user.name }}</td>
          <td>{{ user.email }}</td>
        </tr>
      </ng-template>
    </p-table>
  `
})
export class UserTableComponent {
  private httpClient = inject(HttpClient);
  
  readonly tableState = PrimeNgDynamicTableStateHelper.create<User>({
    url: '/api/users/query',
    httpClient: this.httpClient
  });
}
```

## 📚 Documentation

### Core Features
- **[Table State Management](./docs/table-state-management.md)** - PrimeNG table helpers with lazy loading, filtering, and sorting
- **[Data Storage](./docs/data-storage.md)** - Memoized HTTP caching and component data management
- **[Component State](./docs/component-state.md)** - Reactive state management for UI components
- **[NgSelect Integration](./docs/ng-select-integration.md)** - Complete ng-select lifecycle with search & pagination
- **[Utility Functions](./docs/utility-functions.md)** - Helper functions and TypeScript utility types

### Examples
- **[Complete Examples](./docs/examples/)** - Comprehensive examples and integration patterns
- **[API Integration](./docs/table-state-management.md#api-integration)** - Expected request/response formats
- **[Best Practices](./docs/table-state-management.md#best-practices)** - Performance tips and recommendations

## 🔗 Key Concepts

### API Response Format
```typescript
interface ApiResponse<T> {
  data: T[];           // Array of table row data
  last_row: number;    // Total number of records
}
```

### Filter Types Mapping
The library maps PrimeNG filter types to backend operations:
- `contains` → `like`
- `equals` → `=`
- `startsWith` → `starts`
- `greaterThan` → `>`
- And many more...

### TypeScript Support
Full generic typing for type-safe development:
```typescript
const tableState = PrimeNgDynamicTableStateHelper.create<User>({
  url: '/api/users',
  httpClient: this.httpClient
});
// tableState.data() is typed as Signal<User[]>
```

## License

MIT License - see LICENSE file for details.

## Contributing

Contributions are welcome! Please read our contributing guidelines and submit pull requests to our GitHub repository.

## Support

For issues and questions, please use the GitHub issues page.
