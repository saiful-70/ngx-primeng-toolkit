# ng-component-state-utils

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
- 🔒 **Type Safety**: Comprehensive TypeScript supporte State Helper

A TypeScript utility library for advanced PrimeNG table state management in Angular applications, featuring lazy loading, filtering, sorting, and pagination with NgRx Signals integration.

## Features

- � **Lazy Loading**: Efficient data loading with pagination
- 🔍 **Advanced Filtering**: Support for string, numeric, boolean, date, dropdown, and multiselect filters
- 🔄 **Sorting**: Multi-column sorting capabilities
- 📊 **State Management**: Built with NgRx Signals for reactive state management
- 🎯 **TypeScript Support**: Full type safety and IntelliSense
- 🎨 **PrimeNG Integration**: Seamless integration with PrimeNG Table component
- 📦 **Tree-shakeable**: Import only what you need
- � **Configurable**: Flexible configuration options for various use cases

## Installation

```bash
npm install ng-component-state-utils
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
import { PrimeNgTableStateHelper } from 'ng-component-state-utils';

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
} from 'primeng-table-state-helper';

@Component({
  // ... component configuration
})
export class AdvancedTableComponent {
  readonly tableHeaders = mergeTableHeaders(
    createTextColumn('name', 'Full Name', {
      hasSort: true,
      placeholder: 'Search names...'
    }),
    createTextColumn('email', 'Email Address', {
      defaultMatchMode: 'contains'
    }),
    createNumericColumn('age', 'Age', {
      defaultMatchMode: 'greaterThanOrEqual'
    }),
    createBooleanColumn('active', 'Status'),
    createDateColumn('createdAt', 'Created Date'),
    createDropdownColumn('role', 'Role', createStatusSelectItems({
      'admin': 'Administrator',
      'user': 'Regular User',
      'moderator': 'Moderator'
    }))
  );
}
```

### 3. Advanced Configuration

```typescript
@Component({
  // ... component configuration
})
export class AdvancedUserTableComponent {
  private readonly httpClient = inject(HttpClient);
  
  readonly tableState = PrimeNgTableStateHelper.create<User>({
    url: '/api/users/query',
    httpClient: this.httpClient,
    // Optional: Pass loading spinner context token
    skipLoadingSpinnerContext: SkipLoadingSpinner
  });

  async ngOnInit() {
    // Set up the table with advanced configuration
    this.tableState
      .setUniqueKey('userId')
      .setQueryParams({ 
        includeDeleted: false,
        tenantId: this.currentTenant.id 
      });

    // Load initial data
    await this.tableState.refreshData();
  }

  // Method to change API endpoint dynamically
  async switchToInactiveUsers() {
    this.tableState
      .setUrl('/api/users/inactive/query')
      .clearTableData(this.dataTableRef());
    
    await this.tableState.refreshData();
  }

  // Method to add route parameters
  async loadUsersByDepartment(departmentId: number) {
    this.tableState
      .setRouteParam(departmentId.toString())
      .clearTableData(this.dataTableRef());
    
    await this.tableState.refreshData();
  }

  // Method to update query parameters
  async filterByTenant(tenantId: number) {
    this.tableState
      .patchQueryParams({ tenantId })
      .clearTableData(this.dataTableRef());
    
    await this.tableState.refreshData();
  }
}
```

## API Response Format

The table state helper expects your API to return data in the following format:

```typescript
interface ApiResponse<T> {
  data: T[];           // Array of table row data
  last_page: number;   // Total number of pages
  last_row: number;    // Total number of records
}
```

## API Request Format

The helper sends POST requests with the following structure:

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

## Filter Types

The library supports the following filter mappings:

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

## Utility Functions

### Column Creation Functions

- `createTextColumn(field, label, options)` - Creates text column with string filtering
- `createNumericColumn(field, label, options)` - Creates numeric column with number filtering  
- `createBooleanColumn(field, label, options)` - Creates boolean column with true/false filtering
- `createDateColumn(field, label, options)` - Creates date column with date filtering
- `createDropdownColumn(field, label, options, dropdownOptions)` - Creates dropdown filtered column
- `createMultiselectColumn(field, label, options, selectOptions)` - Creates multiselect filtered column
- `createSimpleColumn(field, label, options)` - Creates basic column without filtering

### Helper Functions

- `createPrimengStringMatchModes()` - Returns SelectItem array for string filter modes
- `createPrimengNumberMatchModes()` - Returns SelectItem array for numeric filter modes
- `createBooleanSelectItems()` - Creates boolean dropdown options
- `createStatusSelectItems()` - Creates status dropdown from object mapping
- `mergeTableHeaders()` - Combines multiple table header configurations

## Class Methods

### PrimeNgTableStateHelper Methods

- `static create<T>(options)` - Creates new instance
- `setUniqueKey(key)` - Sets unique identifier field name
- `setUrl(url)` - Sets API endpoint URL and resets state
- `setRouteParam(param)` - Appends route parameter to URL
- `patchQueryParams(params)` - Merges additional query parameters
- `removeQueryParam(key)` - Removes specific query parameter
- `setQueryParams(params)` - Replaces all query parameters
- `refreshData()` - Reloads data with current state
- `clearTableData(table)` - Clears table data and resets state
- `onLazyLoad(event)` - Handles PrimeNG lazy load events

### Readonly Signals

- `data` - Current table data array
- `isLoading` - Loading state boolean
- `totalRecords` - Total number of records
- `uniqueKey` - Current unique key field name

## Memoized Data Storage

The library also includes a powerful memoized data storage system for caching HTTP responses and managing single/multiple data objects.

### Basic Usage

```typescript
import { Component, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MemoizedDataStorage } from 'ng-component-state-utils';

interface User {
  id: number;
  name: string;
  email: string;
}

@Component({
  selector: 'app-data-example',
  template: `
    <div>
      <!-- Single Data -->
      <button (click)="loadUser()" [disabled]="userStorage.isLoading()">
        {{ userStorage.isLoading() ? 'Loading...' : 'Load User' }}
      </button>
      
      @if (userStorage.singleData(); as user) {
        <div>
          <h3>{{ user.name }}</h3>
          <p>{{ user.email }}</p>
        </div>
      }
      
      <!-- Multiple Data -->
      <button (click)="loadUsers()">Load Users</button>
      @for (user of userStorage.multipleData(); track user.id) {
        <div>{{ user.name }}</div>
      }
    </div>
  `
})
export class DataExampleComponent {
  private httpClient = inject(HttpClient);
  
  userStorage = new MemoizedDataStorage<User>(this.httpClient);

  async loadUser() {
    await this.userStorage.loadSingleData('/api/user/1');
  }
  
  async loadUsers() {
    await this.userStorage.loadMultipleData('/api/users');
  }
}
```

### Advanced Usage with Cache Control

```typescript
export class AdvancedDataComponent {
  private httpClient = inject(HttpClient);
  
  // Create storage for different data types
  configStorage = new MemoizedDataStorage<ApiResponse<any>>(this.httpClient);
  categoryStorage = new MemoizedDataStorage<KeyData<string, string>>(this.httpClient);

  async loadConfig() {
    // First call fetches from API
    await this.configStorage.loadSingleData('/api/config');
    
    // Second call uses cached data
    await this.configStorage.loadSingleData('/api/config');
  }
  
  async refreshConfig() {
    // Force fresh data on next load
    this.configStorage.disableMemoizationOnNextRead();
    await this.configStorage.loadSingleData('/api/config');
  }
  
  async loadCategoriesWithParams() {
    await this.categoryStorage.loadMultipleData('/api/categories', {
      active: true,
      sort: 'name'
    });
  }
  
  clearAllData() {
    this.configStorage.clear();
    this.categoryStorage.clear();
  }
}
```

### MemoizedDataStorage Methods

- `loadSingleData(url, queryParams?)` - Loads single object with optional query parameters
- `loadMultipleData(url, queryParams?)` - Loads array of objects with optional query parameters
- `disableMemoizationOnNextRead()` - Forces fresh data on next load call
- `clear()` - Clears all cached data
- `hasSingleData()` - Checks if single data is cached
- `hasMultipleData()` - Checks if multiple data is cached

### MemoizedDataStorage Signals

- `singleData` - Current single data object or null
- `multipleData` - Current array of data objects
- `isLoading` - Loading state boolean

## Simple Paged Table Helper

For scenarios where you only need basic pagination without filtering or sorting, use the `PrimengPagedDataTableStateHelper`:

```typescript
import { PrimengPagedDataTableStateHelper } from 'primeng-table-state-helper';

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

### Paged Table Expected Response Format

```typescript
interface PagedResponse<T> {
  payload: T[];        // Array of data objects
  totalCount: number;  // Total number of records
}
```

## Component State Management

The `ComponentState` class provides reactive state management for common component operations using Angular signals.

### Basic Usage

```typescript
import { Component } from '@angular/core';
import { ComponentState, ManipulationType } from 'ng-component-state-utils';

@Component({
  selector: 'app-user-management',
  template: `
    <h2>{{ componentState.componentTitleWithManipulationType() }}</h2>
    
    <div class="status-indicators">
      <span>Loading: {{ componentState.isAnyAjaxOperationRunning() }}</span>
      <span>State: {{ componentState.manipulationType() }}</span>
      <span>Multi-Select: {{ componentState.hasMultipleSelection() }}</span>
    </div>
    
    <p-button 
      label="Create User"
      (click)="openCreateDialog()"
      [disabled]="componentState.isAnyAjaxOperationRunning()">
    </p-button>
    
    <p-dialog 
      [header]="componentState.componentTitleWithManipulationType()"
      [(visible)]="componentState.isCreateOrUpdateDialogOpen()">
      <!-- Dialog content -->
    </p-dialog>
  `
})
export class UserManagementComponent {
  componentState = new ComponentState()
    .updateComponentTitle('User')
    .updateCheckBoxSelectionStatus(true);

  openCreateDialog() {
    this.componentState
      .updateManipulationType(ManipulationType.Create)
      .setCreateOrUpdateDialogOpen(true);
  }
}
```

### ComponentState Properties

#### Signals
- `isAjaxDataIncoming` - Incoming data loading state
- `isAjaxRequestOutgoing` - Outgoing request state  
- `enableCheckBoxSelection` - Checkbox selection enabled state
- `isSelectableRowEnabled` - Row selection enabled state
- `hasMultipleSelection` - Multiple selection mode state
- `isCreateOrUpdateDialogOpen` - Generic dialog open state
- `isUpdateDialogOpen` - Update dialog specific state
- `isCreateDialogOpen` - Create dialog specific state
- `manipulationType` - Current operation type (Create/Update/Delete/View)
- `componentTitle` - Component title

#### Computed Signals
- `componentTitleWithManipulationType()` - Title combined with operation type
- `isOnUpdateState()` - True if in update mode
- `isOnCreateState()` - True if in create mode  
- `isOnDeleteState()` - True if in delete mode
- `isOnViewState()` - True if in view mode
- `isAnyAjaxOperationRunning()` - True if any Ajax operation is active
- `isAnyDialogOpen()` - True if any dialog is open

### ComponentState Methods

```typescript
// Fluent API for chaining operations
componentState
  .updateComponentTitle('Product Management')
  .updateManipulationType(ManipulationType.Update)
  .setCreateOrUpdateDialogOpen(true)
  .updateMultipleSelectionStatus(false);
```

## Component Data Storage

The `ComponentDataStorage<T>` class provides reactive data management for single objects and arrays.

### Basic Usage

```typescript
import { Component, OnInit } from '@angular/core';
import { ComponentDataStorage } from 'ng-component-state-utils';

interface User {
  id: number;
  name: string;
  email: string;
}

@Component({
  selector: 'app-user-data',
  template: `
    <!-- Single User Display -->
    @if (dataStorage.singleData(); as user) {
      <div class="user-card">
        <h3>{{ user.name }}</h3>
        <p>{{ user.email }}</p>
        <p-button label="Update Email" (click)="updateEmail()"></p-button>
      </div>
    }
    
    <!-- Multiple Users Display -->
    <div class="users-list">
      <h4>Users ({{ dataStorage.getMultipleDataCount() }})</h4>
      @for (user of dataStorage.multipleData(); track user.id) {
        <div class="user-item">
          {{ user.name }} - {{ user.email }}
          <p-button 
            icon="pi pi-times" 
            size="small"
            (click)="removeUser(user.id)">
          </p-button>
        </div>
      }
    </div>
    
    <p-button label="Add Sample User" (click)="addSampleUser()"></p-button>
  `
})
export class UserDataComponent implements OnInit {
  dataStorage = new ComponentDataStorage<User>();

  ngOnInit() {
    // Initialize with sample data
    this.dataStorage
      .updateSingleData({ id: 1, name: 'John Doe', email: 'john@example.com' })
      .updateMultipleData([
        { id: 1, name: 'John Doe', email: 'john@example.com' },
        { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
      ]);
  }

  updateEmail() {
    this.dataStorage.patchSingleData({ 
      email: `updated-${Date.now()}@example.com` 
    });
  }

  addSampleUser() {
    const newUser: User = {
      id: Date.now(),
      name: 'New User',
      email: 'newuser@example.com'
    };
    
    this.dataStorage.addToMultipleData(newUser);
  }

  removeUser(userId: number) {
    this.dataStorage.removeFromMultipleData(user => user.id === userId);
  }
}
```

### ComponentDataStorage Methods

#### Data Operations
- `updateSingleData(data)` - Replace single data completely
- `updateMultipleData(array)` - Replace multiple data array
- `patchSingleData(partial)` - Merge partial data with existing single data
- `patchMultipleData(array)` - Append new items to existing array
- `addToMultipleData(item)` - Add single item to array
- `removeFromMultipleData(predicate)` - Remove items matching predicate
- `updateItemInMultipleData(predicate, updateFn)` - Update specific items

#### Utility Methods
- `clearAll()` - Clear both single and multiple data
- `clearSingleData()` - Clear only single data
- `clearMultipleData()` - Clear only multiple data
- `hasSingleData()` - Check if single data exists
- `hasMultipleData()` - Check if multiple data has items
- `getMultipleDataCount()` - Get count of multiple data items
- `findInMultipleData(predicate)` - Find item in multiple data
- `existsInMultipleData(predicate)` - Check if item exists

### Advanced Usage Example

```typescript
@Component({
  selector: 'app-advanced-data-management'
})
export class AdvancedDataManagementComponent {
  userStorage = new ComponentDataStorage<User>();
  componentState = new ComponentState()
    .updateComponentTitle('Advanced User Management');

  async loadUsers() {
    this.componentState.setAjaxDataIncoming(true);
    
    try {
      const users = await this.fetchUsers();
      this.userStorage.updateMultipleData(users);
      
      // Set first user as selected
      if (users.length > 0) {
        this.userStorage.updateSingleData(users[0]);
      }
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      this.componentState.setAjaxDataIncoming(false);
    }
  }

  async updateUser(userId: number, updates: Partial<User>) {
    this.componentState.setAjaxRequestOutgoing(true);
    
    try {
      const updatedUser = await this.updateUserAPI(userId, updates);
      
      // Update in both single and multiple data if it's the same user
      this.userStorage.updateItemInMultipleData(
        user => user.id === userId,
        () => updatedUser
      );
      
      if (this.userStorage.singleData()?.id === userId) {
        this.userStorage.updateSingleData(updatedUser);
      }
    } catch (error) {
      console.error('Failed to update user:', error);
    } finally {
      this.componentState.setAjaxRequestOutgoing(false);
    }
  }

  private async fetchUsers(): Promise<User[]> {
    // Your API call here
    return [];
  }

  private async updateUserAPI(userId: number, updates: Partial<User>): Promise<User> {
    // Your API call here
    return {} as User;
  }
}
```

## NgSelectHelper

The `NgSelectHelper` class provides comprehensive state management for ng-select components with features like pagination, search, caching, and error handling.

### Basic Usage

```typescript
import { Component, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { NgSelectHelper } from 'ng-component-state-utils';

interface User {
  id: number;
  name: string;
  email: string;
}

@Component({
  selector: 'app-user-select',
  template: `
    <ng-select
      [items]="userSelectHelper.loadedData().payload"
      bindLabel="name"
      bindValue="id"
      placeholder="Search users..."
      [loading]="userSelectHelper.isLoading()"
      [typeahead]="userSelectHelper.inputSubject"
      [(ngModel)]="selectedUserId"
      (open)="userSelectHelper.onOpen()"
      (close)="userSelectHelper.onClose()"
      (clear)="userSelectHelper.onClear()"
      (scrollToEnd)="userSelectHelper.onScrollToEnd()">
      
      <ng-option-highlight 
        [term]="userSelectHelper.inputSubject | async" 
        [text]="option.name">
      </ng-option-highlight>
    </ng-select>
  `
})
export class UserSelectComponent {
  private httpClient = inject(HttpClient);
  private destroyRef = inject(DestroyRef);

  userSelectHelper = NgSelectHelper.create<User>({
    ajaxUrl: '/api/users',
    httpClient: this.httpClient,
    destroyRef: this.destroyRef,
    limit: 20,
    useCache: true
  });

  selectedUserId: number | null = null;

  ngOnInit() {
    this.userSelectHelper.init();
  }
}
```

### Advanced Usage with POST Requests

```typescript
@Component({
  selector: 'app-product-select'
})
export class ProductSelectComponent {
  productSelectHelper = NgSelectHelper.create<Product>({
    ajaxUrl: '/api/products/search',
    httpClient: this.httpClient,
    destroyRef: this.destroyRef,
    usePostRequest: true,
    limit: 15,
    useCache: false
  });

  ngOnInit() {
    this.productSelectHelper
      .setDebounceTimeInSecond(1)
      .setBody({ 
        filters: [{ field: 'active', value: true }],
        sort: [{ field: 'name', direction: 'asc' }]
      })
      .init();

    // Handle errors
    this.productSelectHelper.ajaxError$.subscribe(error => {
      console.error('Product search failed:', error);
    });
  }

  filterByCategory(categoryId: number) {
    this.productSelectHelper
      .setBody({ 
        filters: [
          { field: 'active', value: true },
          { field: 'categoryId', value: categoryId }
        ]
      })
      .resetAll({ resetCache: true });
  }
}
```

### Multi-Select with Form Integration

```typescript
import { FormControl, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-department-multi-select',
  template: `
    <form [formGroup]="form">
      <ng-select
        [items]="departmentSelectHelper.loadedData().payload"
        bindLabel="name"
        bindValue="id"
        [multiple]="true"
        [closeOnSelect]="false"
        formControlName="departments"
        [loading]="departmentSelectHelper.isLoading()"
        [typeahead]="departmentSelectHelper.inputSubject"
        (open)="departmentSelectHelper.onOpen()"
        (scrollToEnd)="departmentSelectHelper.onScrollToEnd()">
      </ng-select>
    </form>
  `
})
export class DepartmentMultiSelectComponent {
  departmentSelectHelper = NgSelectHelper.create<Department>({
    ajaxUrl: '/api/departments',
    httpClient: this.httpClient,
    destroyRef: this.destroyRef,
    limit: 50
  });

  form = new FormGroup({
    departments: new FormControl<number[]>([])
  });

  ngOnInit() {
    this.departmentSelectHelper
      .setDebounceTimeInSecond(0.5)
      .init();
  }
}
```

### NgSelectHelper Configuration Options

```typescript
interface NgSelectHelperConfig<TData> {
  ajaxUrl: string;                    // API endpoint URL
  httpClient: HttpClient;             // Angular HttpClient
  destroyRef: DestroyRef;            // Angular DestroyRef for cleanup
  usePostRequest?: boolean;           // Use POST instead of GET (default: false)
  limit?: number;                     // Items per page (default: 10)
  useCache?: boolean;                 // Enable response caching (default: false)
  queryParams?: Record<string, any>;  // Initial query parameters
  body?: any;                        // Request body for POST requests
  httpOptions?: any;                 // Additional HTTP options
}
```

### NgSelectHelper Methods

**Configuration Methods:**
- `init()` - Initialize the helper and load first page
- `setDebounceTimeInSecond(seconds: number)` - Set search debounce time
- `patchQueryParams(params: Record<string, any>)` - Update query parameters
- `removeQueryParam(key: string)` - Remove a query parameter
- `setBody(body: any)` - Set request body for POST requests
- `resetAll(options)` - Reset all data with options

**Event Handlers:**
- `onOpen()` - Handle ng-select open event
- `onClose()` - Handle ng-select close event
- `onClear()` - Handle ng-select clear event
- `onScrollToEnd()` - Handle infinite scroll

**Cache Management:**
- `clearCache()` - Clear cached responses
- `refreshData()` - Refresh current data

### NgSelectHelper Signals

**Data Signals:**
- `loadedData()` - Currently loaded data with pagination info
- `isLoading()` - Loading state
- `totalCount` - Total available records
- `page` - Current page number
- `limitReached` - Whether pagination limit reached

**Input Management:**
- `inputSubject` - Subject for search input (use with typeahead)

**Error Handling:**
- `ajaxError$` - Observable for API errors
- `isLastApiCallSuccessful` - Whether last API call succeeded

### Integration with Other Helpers

```typescript
@Component({
  selector: 'app-integrated-form'
})
export class IntegratedFormComponent {
  // Component state management
  componentState = new ComponentState()
    .updateComponentTitle('User Management');

  // Data storage
  userDataStorage = new ComponentDataStorage<User>();

  // Select helpers
  departmentSelectHelper = NgSelectHelper.create<Department>({
    ajaxUrl: '/api/departments',
    httpClient: this.httpClient,
    destroyRef: this.destroyRef
  });

  async createUser(userData: Partial<User>) {
    this.componentState.setAjaxRequestOutgoing(true);
    
    try {
      const newUser = await this.userService.create(userData);
      this.userDataStorage.addToMultipleData(newUser);
      
      // Clear department select cache to ensure fresh data
      this.departmentSelectHelper.clearCache();
      
    } catch (error) {
      console.error('Failed to create user:', error);
    } finally {
      this.componentState.setAjaxRequestOutgoing(false);
    }
  }
}
```

For a comprehensive ng-select example, see `example-ng-select-usage.ts`.

## Complete Integration Example

For a comprehensive example showing all features working together, see the `example-usage-all-features.ts` file which demonstrates:

- Table state management with filtering and sorting
- Memoized data storage for reference data
- Component state management for dialogs and operations
- Component data storage for selected items
- Integration between all systems

## Error Handling

```

The library includes built-in error handling:

```typescript
try {
  await this.tableState.refreshData();
} catch (error) {
  // Handle API errors
  console.error('Failed to load table data:', error);
  this.toastService.showError('Failed to load data');
}
```

## TypeScript Support

Full TypeScript support with generic typing:

```typescript
interface CustomUser {
  id: string;
  firstName: string;
  lastName: string;
  department: {
    id: number;
    name: string;
  };
}

const tableState = PrimeNgTableStateHelper.create<CustomUser>({
  url: '/api/users',
  httpClient: this.httpClient
});

// tableState.data() is typed as Signal<CustomUser[]>
```

## License

MIT License - see LICENSE file for details.

## Contributing

Contributions are welcome! Please read our contributing guidelines and submit pull requests to our GitHub repository.

## Support

For issues and questions, please use the GitHub issues page.

This package uses automated versioning and publishing through GitHub Actions. Contributors don't need to manually update versions or publish to NPM.

#### Commit Message Format

Use conventional commit messages to trigger automatic version bumps:

```bash
# For bug fixes (patch version: 1.0.0 → 1.0.1)
git commit -m "fix: resolve checkbox state issue"

# For new features (minor version: 1.0.0 → 1.1.0)  
git commit -m "feat: add new utility function"

# For breaking changes (major version: 1.0.0 → 2.0.0)
git commit -m "major: change API interface"
# OR
git commit -m "feat: new feature

BREAKING CHANGE: API has changed"

# Other commits (no version bump)
git commit -m "docs: update README"
git commit -m "chore: update dependencies"
```

#### Development Workflow

1. **Make your changes**
2. **Commit with proper message format**
3. **Push to main branch**
4. **GitHub Actions automatically:**
   - Runs tests and type checking
   - Bumps version based on commit message
   - Publishes to NPM
   - Creates git tags

```bash
# Example workflow
git add .
git commit -m "feat: add new tri-state utility"
git push origin main
# 🎉 Package automatically published!
```

#### Pull Request Workflow

For larger changes, use pull requests:

```bash
# Create feature branch
git checkout -b feature/new-functionality

# Make changes and commit
git commit -m "feat: add advanced tri-state features"

# Push and create PR
git push origin feature/new-functionality
# Create PR on GitHub → Merge → Automatic publish!
```

## Browser Support

- Modern browsers supporting ES2020+
- Angular 19+
- PrimeNG 19+ (optional, for table helpers)
- @ng-select/ng-select 15+ (optional, for select helpers)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License. See LICENSE file for details.

## Links

- [PrimeNG Documentation](https://primeng.org/)
- [@ng-select/ng-select Documentation](https://github.com/ng-select/ng-select)
- [Angular Reactive Forms](https://angular.io/guide/reactive-forms)
- [NgRx Signals](https://ngrx.io/guide/signals)
