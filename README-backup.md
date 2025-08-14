# NGX PrimeNG Toolkit

A comprehensive TypeScript utility library for Angular component state management, including PrimeNG table helpers, ng-select integration, data storage, and HTTP caching utilities with NgRx Signals.

## Features

### 🏗️ Table State Management
- **Lazy Loading**: Efficient data loading with pagination
- **Advanced Filtering**: Support for string, numeric, boolean, date, dropdown, and multiselect filters
- **Sorting**: Multi-column sorting capabilities
- **State Management**: Built with NgRx Signals for reactive state management
- **TypeScript Support**: Full type safety and IntelliSense
- **PrimeNG Integration**: Seamless integration with PrimeNG Table component

### 🎛️ Select Component Integration  
- **ng-select Helper**: Complete ng-select lifecycle management
- **Search & Pagination**: Debounced search with infinite scroll
- **HTTP Caching**: Intelligent response caching for performance
- **Multi-Select Support**: Advanced multi-selection capabilities
- **Error Handling**: Built-in error management and recovery

### Memoized Data Storage
- 💾 **Smart Caching**: Automatic data caching with memoization
- 🔄 **Cache Control**: Fine-grained cache invalidation and refresh
- 📡 **HTTP Integration**: Built-in HTTP client integration
- 🔧 **Configurable**: Flexible query parameters and options
- ⚡ **Performance**: Reduces redundant API calls

### Component State Management
- 🎛️ **Reactive State**: Signal-based component state management
- 🔄 **Manipulation Types**: Support for Create, Update, Delete, View operations
- 📋 **Dialog Management**: Built-in dialog state handling
- 🔄 **Ajax State**: Loading and request state management
- 🎯 **Computed Values**: Derived state through computed signals

### Component Data Storage
- 📦 **Data Management**: Generic data storage for single and multiple objects
- 🔄 **Reactive Updates**: Signal-based data updates with patching support
- 🎯 **Type Safe**: Full TypeScript support for data operations
- 🔍 **Search & Filter**: Built-in methods for finding and manipulating data
- ⚡ **Performance**: Efficient data updates with minimal re-renders

### Additional Features
- 📦 **Tree-shakeable**: Import only what you need
- 🏗️ **Dual Helpers**: Dynamic table helper (with filtering) and simple paged table helper
- 🛠️ **Utility Functions**: Column configuration and filter utilities
- 🔒 **Type Safety**: Comprehensive TypeScript support

## Installation

```bash
npm install ngx-primeng-toolkit
```

## Peer Dependencies

```bash
# Core dependencies
npm install @angular/common @angular/core @ngrx/signals rxjs

# UI library dependencies (choose what you need)
npm install primeng        # For PrimeNG table helpers
npm install @ng-select/ng-select  # For ng-select helpers
```

Optional (for response validation):
```bash
npm install zod
```

## Basic Usage

### 1. Setting Up the Table State Helper

```typescript
import { Component, inject, viewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Table } from 'primeng/table';
import { PrimeNgTableStateHelper } from 'ngx-primeng-toolkit';

interface User {
  id: number;
  name: string;
  email: string;
  active: boolean;
  createdAt: Date;
}

@Component({
  selector: 'app-user-table',
  template: `
    <p-table 
      #dt
      [value]="tableState.data()"
      [lazy]="true"
      [paginator]="true"
      [rows]="15"
      [totalRecords]="tableState.totalRecords()"
      [loading]="tableState.isLoading()"
      (onLazyLoad)="tableState.onLazyLoad($event)">
      
      <ng-template pTemplate="header">
        <tr>
          <th pSortableColumn="name">
            Name
            <p-sortIcon field="name"></p-sortIcon>
          </th>
          <th pSortableColumn="email">
            Email
            <p-sortIcon field="email"></p-sortIcon>
          </th>
          <th>Active</th>
        </tr>
        <tr>
          <th>
            <p-columnFilter 
              type="text" 
              field="name" 
              placeholder="Search by name">
            </p-columnFilter>
          </th>
          <th>
            <p-columnFilter 
              type="text" 
              field="email" 
              placeholder="Search by email">
            </p-columnFilter>
          </th>
          <th>
            <p-columnFilter 
              type="boolean" 
              field="active">
            </p-columnFilter>
          </th>
        </tr>
      </ng-template>
      
      <ng-template pTemplate="body" let-user>
        <tr>
          <td>{{ user.name }}</td>
          <td>{{ user.email }}</td>
          <td>
            <i class="pi" 
               [ngClass]="user.active ? 'pi-check text-green-500' : 'pi-times text-red-500'">
            </i>
          </td>
        </tr>
      </ng-template>
      
    </p-table>
  `
})
export class UserTableComponent {
  private readonly httpClient = inject(HttpClient);
  private readonly dataTableRef = viewChild.required<Table>('dt');

  readonly tableState = PrimeNgTableStateHelper.create<User>({
    url: '/api/users/query',
    httpClient: this.httpClient
  });

  ngOnInit() {
    // Optional: Configure unique key and query parameters
    this.tableState
      .setUniqueKey('id')
      .patchQueryParams({ includeDeleted: false });
  }
}
```

### 2. Using Table Configuration Utilities

```typescript
import { 
  createTextColumn, 
  createNumericColumn, 
  createBooleanColumn,
  createDateColumn,
  createDropdownColumn,
  mergeTableHeaders,
  createStatusSelectItems
} from 'ngx-primeng-toolkit';

@Component({
  // ... component configuration
})
export class AdvancedTableComponent {
  readonly tableHeaders = mergeTableHeaders(
    createTextColumn('name', 'Full Name', {
      hasSort: true,
      hasFilter: true,
      width: '200px'
    }),
    createNumericColumn('salary', 'Salary', {
      hasSort: true,
      hasFilter: true,
      format: 'currency'
    }),
    createBooleanColumn('active', 'Status', {
      hasFilter: true
    }),
    createDateColumn('createdAt', 'Created', {
      hasSort: true,
      hasFilter: true,
      dateFormat: 'dd/MM/yyyy'
    }),
    createDropdownColumn('department', 'Department', {
      hasFilter: true,
      options: [
        { label: 'Engineering', value: 'eng' },
        { label: 'Marketing', value: 'marketing' },
        { label: 'Sales', value: 'sales' }
      ]
    })
  );
}
```

### 3. API Request Format

The library expects your backend to accept POST requests with this structure:

```typescript
// Request body
{
  "pagination": {
    "page": 1,
    "size": 15
  },
  "filter": [
    {
      "field": "name",
      "operator": "contains",
      "value": "john"
    },
    {
      "field": "active",
      "operator": "equals",
      "value": true
    }
  ],
  "sort": [
    {
      "field": "createdAt",
      "direction": "desc"
    }
  ]
}

// Response format
{
  "data": [...],           // Array of your data objects
  "totalRecords": 150      // Total number of records for pagination
}
```

## 🏗️ Architecture

The library is organized into focused modules for better tree-shaking and maintainability:

```
src/
├── dynamic-table-state-helper.ts    # Advanced table with filtering & sorting
├── paged-table-state-helper.ts      # Simple pagination table
├── memoized-data-storage.ts         # Caching utilities
├── component-state.ts               # Component state management
├── component-data-storage.ts        # Data storage utilities
├── ng-select-helper.ts              # NgSelect integration
├── table-utils.ts                   # Table utility functions
├── http-context-tokens.ts           # HTTP context tokens
├── types.ts                         # Type definitions
└── index.ts                         # Main exports
```

## 🔧 Usage Examples

Check the `examples/comprehensive-usage.example.ts` file for a complete real-world implementation showing all features integrated together.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
