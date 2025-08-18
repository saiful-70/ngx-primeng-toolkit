# Table State Management

This guide covers the PrimeNG table helpers with lazy loading, filtering, sorting, and pagination capabilities.

## Dynamic Table State Helper

The `PrimeNgDynamicTableStateHelper` provides comprehensive table state management with filtering and sorting capabilities.

### Basic Setup

```typescript
import { Component, inject, viewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Table } from 'primeng/table';
import { PrimeNgDynamicTableStateHelper } from 'ngx-primeng-toolkit';

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
      [loading]="tableState.isLoading()"
      [totalRecords]="tableState.totalRecords()"
      [paginator]="true"
      [rows]="10"
      [showCurrentPageReport]="true"
      (onLazyLoad)="tableState.onLazyLoad($event)">
      
      <ng-template pTemplate="header">
        <tr>
          <th pSortableColumn="name">
            Name <p-sortIcon field="name"></p-sortIcon>
          </th>
          <th pSortableColumn="email">
            Email <p-sortIcon field="email"></p-sortIcon>
          </th>
          <th>Active</th>
        </tr>
      </ng-template>
      
      <ng-template pTemplate="body" let-user>
        <tr>
          <td>{{ user.name }}</td>
          <td>{{ user.email }}</td>
          <td>
            <p-tag [value]="user.active ? 'Active' : 'Inactive'" 
                   [severity]="user.active ? 'success' : 'secondary'">
            </p-tag>
          </td>
        </tr>
      </ng-template>
    </p-table>
  `
})
export class UserTableComponent {
  private readonly httpClient = inject(HttpClient);
  private readonly dataTableRef = viewChild.required<Table>('dt');

  readonly tableState = PrimeNgDynamicTableStateHelper.create<User>({
    url: '/api/users/query',
    httpClient: this.httpClient
  });

  ngOnInit() {
    // Optional: Configure unique key and query parameters
    this.tableState.setUniqueKey('id');
  }
}
```

### Advanced Configuration

```typescript
@Component({
  // ... component configuration
})
export class AdvancedUserTableComponent {
  private readonly httpClient = inject(HttpClient);
  
  readonly tableState = PrimeNgDynamicTableStateHelper.create<User>({
    url: '/api/users/query',
    httpClient: this.httpClient,
    skipLoadingSpinnerContext: SkipLoadingSpinner
  });

  async ngOnInit() {
    // Set up the table with advanced configuration
    this.tableState.setUniqueKey('id');
    await this.tableState.refreshData();
  }

  // Method to change API endpoint dynamically
  async switchToInactiveUsers() {
    this.tableState.setUrl('/api/users/inactive/query');
    await this.tableState.refreshData();
  }

  // Method to add route parameters
  async loadUsersByDepartment(departmentId: number) {
    this.tableState.setRouteParam(departmentId.toString());
    await this.tableState.refreshData();
  }

  // Method to update query parameters
  async filterByTenant(tenantId: number) {
    this.tableState.patchQueryParams({ tenantId });
    await this.tableState.refreshData();
  }
}
```

## Table Configuration Utilities

### Column Creation Functions

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
      sortable: true,
      filter: true,
      filterPlaceholder: 'Search by name...'
    }),
    createNumericColumn('age', 'Age', {
      sortable: true,
      filter: true
    }),
    createBooleanColumn('active', 'Status', {
      sortable: true,
      filter: true
    }),
    createDateColumn('createdAt', 'Created Date', {
      sortable: true,
      filter: true
    }),
    createDropdownColumn('department', 'Department', {
      sortable: true,
      filter: true
    }, [
      { label: 'IT', value: 'it' },
      { label: 'HR', value: 'hr' },
      { label: 'Finance', value: 'finance' }
    ])
  );
}
```

### Helper Functions

```typescript
// String filter modes
const stringFilters = createPrimengStringMatchModes();

// Number filter modes
const numberFilters = createPrimengNumberMatchModes();

// Boolean options
const booleanOptions = createBooleanSelectItems();

// Status dropdown from object
const statusOptions = createStatusSelectItems({
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  PENDING: 'Pending'
});
```

## Simple Paged Table Helper

For basic pagination without filtering or sorting:

```typescript
import { PrimengPagedDataTableStateHelper } from 'ngx-primeng-toolkit';

interface Product {
  id: number;
  name: string;
  price: number;
}

@Component({
  selector: 'app-simple-table',
  template: `
    <p-table 
      [value]="pagedHelper.data()"
      [lazy]="true"
      [loading]="pagedHelper.isLoading()"
      [totalRecords]="pagedHelper.totalRecords()"
      [paginator]="true"
      [rows]="10"
      (onLazyLoad)="pagedHelper.onLazyLoad($event)">
      
      <ng-template pTemplate="header">
        <tr>
          <th>Name</th>
          <th>Price</th>
        </tr>
      </ng-template>
      
      <ng-template pTemplate="body" let-product>
        <tr>
          <td>{{ product.name }}</td>
          <td>{{ product.price | currency }}</td>
        </tr>
      </ng-template>
    </p-table>
  `
})
export class SimpleTableComponent {
  private httpClient = inject(HttpClient);
  
  pagedHelper = PrimengPagedDataTableStateHelper.create<Product>({
    url: '/api/products',
    httpClient: this.httpClient
  });
}
```

## API Integration

### Expected Response Format (Dynamic Table)

```typescript
interface ApiResponse<T> {
  data: T[];           // Array of table row data
  last_page: number;   // Total number of pages
  last_row: number;    // Total number of records
}
```

### Expected Response Format (Paged Table)

```typescript
interface PagedResponse<T> {
  payload: T[];        // Array of data objects
  totalCount: number;  // Total number of records
}
```

### Request Format

The helper sends POST requests with this structure:

```typescript
interface DynamicQueryDto {
  size: number;                    // Page size
  page: number;                    // Current page (1-based)
  filter: DynamicQueryFilterDto[]; // Array of filters
  sort: DynamicQuerySortDto[];     // Array of sort criteria
}

interface DynamicQueryFilterDto {
  field: string;        // Field name to filter
  value: string;        // Filter value (always string)
  type: FilterTypeMapped; // Filter operation type
}

interface DynamicQuerySortDto {
  field: string;        // Field name to sort
  dir: 'asc' | 'desc';  // Sort direction
}
```

## Filter Types Mapping

| PrimeNG Filter Type | Backend Filter Type | Description |
|-------------------|-------------------|-------------|
| `startsWith` | `starts` | Field starts with value |
| `notStartsWith` | `!starts` | Field does not start with value |
| `endsWith` | `ends` | Field ends with value |
| `notEndsWith` | `!ends` | Field does not end with value |
| `contains` | `like` | Field contains value |
| `notContains` | `!like` | Field does not contain value |
| `equals` | `=` | Field equals value |
| `notEquals` | `!=` | Field does not equal value |
| `greaterThan` | `>` | Field is greater than value |
| `lessThan` | `<` | Field is less than value |
| `greaterThanOrEqual` | `>=` | Field is greater than or equal to value |
| `lessThanOrEqual` | `<=` | Field is less than or equal to value |

## Methods Reference

### PrimeNgDynamicTableStateHelper

**Configuration Methods:**
- `static create<T>(options)` - Creates new instance
- `setUniqueKey(key)` - Sets unique identifier field name
- `setUrl(url)` - Sets API endpoint URL and resets state
- `setRouteParam(param)` - Appends route parameter to URL
- `patchQueryParams(params)` - Merges additional query parameters
- `removeQueryParam(key)` - Removes specific query parameter
- `setQueryParams(params)` - Replaces all query parameters

**Data Methods:**
- `refreshData()` - Reloads data with current state
- `clearTableData(table)` - Clears table data and resets state
- `onLazyLoad(event)` - Handles PrimeNG lazy load events

**Readonly Signals:**
- `data` - Current table data array
- `isLoading` - Loading state boolean
- `totalRecords` - Total number of records
- `uniqueKey` - Current unique key field name

## Error Handling

```typescript
try {
  await this.tableState.refreshData();
} catch (error) {
  // Handle API errors
  this.toastService.showError('Failed to load data');
}
```

## TypeScript Support

Full TypeScript support with generic typing:

```typescript
interface CustomUser {
  id: string;
  customField: boolean;
}

const tableState = PrimeNgDynamicTableStateHelper.create<CustomUser>({
  url: '/api/users',
  httpClient: this.httpClient
});

// tableState.data() is typed as Signal<CustomUser[]>
```
