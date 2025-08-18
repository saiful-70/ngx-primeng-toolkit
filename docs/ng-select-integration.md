# NgSelect Integration

This guide covers comprehensive ng-select lifecycle management with search, pagination, caching, and error handling.

## Centralized NgSelect Initialization

The recommended approach is using the `initNgSelect` utility function for streamlined initialization with centralized error handling.

### Recommended Usage Pattern

```typescript
import { Component, inject, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { HttpClient } from '@angular/common/http';
import { DestroyRef } from '@angular/core';
import { NgSelectHelper, initNgSelect } from 'ngx-primeng-toolkit';

interface KeyData<K, V> {
  key: K;
  data: V;
}

@Component({
  selector: 'app-select-example',
  template: `
    <div>
      <!-- User Select -->
      <ng-select [items]="userSelectHelper.loadedData()"
                 bindLabel="name"
                 bindValue="id"
                 [loading]="userSelectHelper.isLoading()"
                 [typeahead]="userSelectHelper.inputSubject"
                 (open)="userSelectHelper.onOpen()"
                 (close)="userSelectHelper.onClose()"
                 (clear)="userSelectHelper.onClear()"
                 (scrollToEnd)="userSelectHelper.onScrollToEnd()"
                 placeholder="Select user...">
      </ng-select>

      <!-- Department Multi-Select -->
      <ng-select [items]="departmentSelectHelper.loadedData()"
                 bindLabel="name"
                 bindValue="id"
                 [loading]="departmentSelectHelper.isLoading()"
                 [multiple]="true"
                 [typeahead]="departmentSelectHelper.inputSubject"
                 (open)="departmentSelectHelper.onOpen()"
                 (scrollToEnd)="departmentSelectHelper.onScrollToEnd()"
                 placeholder="Select departments...">
      </ng-select>
    </div>
  `
})
export class SelectExampleComponent {
  private readonly httpClient = inject(HttpClient);
  private readonly destroyRef = inject(DestroyRef);
  
  // Create helpers
  userSelectHelper = NgSelectHelper.create<KeyData<number, User>>({
    ajaxUrl: '/api/users/search',
    httpClient: this.httpClient
  });
  
  departmentSelectHelper = NgSelectHelper.create<KeyData<string, Department>>({
    ajaxUrl: '/api/departments/search',
    httpClient: this.httpClient
  });
  
  // Signal containing all helpers for centralized initialization
  private helpersSignal = signal([
    this.userSelectHelper,
    this.departmentSelectHelper
  ]);
  
  ngOnInit() {
    // Initialize all helpers with centralized error handling
    initNgSelect(
      toObservable(this.helpersSignal),
      this.destroyRef,
      (error) => {
        console.error('NgSelect error:', error);
        // Show toast notification or handle error as needed
        this.toastService.showError('Failed to load data');
      }
    );
    
    // Configure individual helpers if needed
    this.userSelectHelper.setDebounceTimeInSecond(0.5);
    this.departmentSelectHelper.patchQueryParams({ active: true });
  }
}
```

### Benefits of Centralized Initialization

1. **Single Point of Error Handling**: All NgSelect errors are handled consistently
2. **Automatic Cleanup**: Uses `takeUntilDestroyed` for proper subscription cleanup
3. **Lazy Initialization**: Only initializes helpers that haven't been initialized yet
4. **Type Safety**: Full TypeScript support with proper type inference

## Individual NgSelectHelper Usage

For more granular control, you can use NgSelectHelper individually:

### Basic Setup

```typescript
import { Component, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { NgSelectHelper } from 'ngx-primeng-toolkit';

interface User {
  id: number;
  name: string;
  email: string;
}

@Component({
  selector: 'app-user-select',
  template: `
    <ng-select [items]="userSelectHelper.loadedData()"
               bindLabel="name"
               bindValue="id"
               [loading]="userSelectHelper.isLoading()"
               [typeahead]="userSelectHelper.inputSubject"
               (open)="userSelectHelper.onOpen()"
               (close)="userSelectHelper.onClose()"
               (clear)="userSelectHelper.onClear()"
               (scrollToEnd)="userSelectHelper.onScrollToEnd()"
               placeholder="Search users..."
               [clearable]="true">
    </ng-select>
    
    <div *ngIf="!userSelectHelper.isLastApiCallSuccessful()">
      Failed to load data. <button (click)="userSelectHelper.refreshData()">Retry</button>
    </div>
  `
})
export class UserSelectComponent {
  private httpClient = inject(HttpClient);
  
  userSelectHelper = NgSelectHelper.create<User>({
    ajaxUrl: '/api/users/search',
    httpClient: this.httpClient
  });
  
  ngOnInit() {
    // Initialize and configure
    this.userSelectHelper.init();
    this.userSelectHelper.setDebounceTimeInSecond(0.3);
    
    // Handle errors
    this.userSelectHelper.ajaxError$.subscribe(error => {
      console.error('API Error:', error);
      this.showErrorToast('Failed to load users');
    });
  }
}
```

### Advanced Configuration with POST Requests

```typescript
@Component({
  selector: 'app-product-select'
})
export class ProductSelectComponent {
  productSelectHelper = NgSelectHelper.create<Product>({
    ajaxUrl: '/api/products/search',
    httpClient: this.httpClient,
    httpOptions: {
      headers: { 'Authorization': 'Bearer ' + this.authToken }
    }
  });
  
  ngOnInit() {
    // Configure for POST requests with body
    this.productSelectHelper
      .setBody({
        filters: {
          category: 'electronics',
          minPrice: 100
        }
      })
      .patchQueryParams({
        includeInactive: false
      })
      .init();
  }
  
  filterByCategory(category: string) {
    this.productSelectHelper
      .setBody({
        filters: { category }
      })
      .refreshData();
  }
}
```

### Multi-Select with Form Integration

```typescript
import { FormControl, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-department-multi-select',
  template: `
    <form [formGroup]="assignmentForm">
      <ng-select [items]="departmentSelectHelper.loadedData()"
                 bindLabel="name"
                 bindValue="id"
                 [loading]="departmentSelectHelper.isLoading()"
                 [multiple]="true"
                 [closeOnSelect]="false"
                 [clearSearchOnAdd]="false"
                 [typeahead]="departmentSelectHelper.inputSubject"
                 formControlName="departmentIds"
                 (open)="departmentSelectHelper.onOpen()"
                 (scrollToEnd)="departmentSelectHelper.onScrollToEnd()"
                 placeholder="Select departments...">
        
        <ng-option *ngFor="let dept of departmentSelectHelper.loadedData()" 
                   [value]="dept.id">
          {{ dept.name }} ({{ dept.employeeCount }} employees)
        </ng-option>
      </ng-select>
    </form>
  `
})
export class DepartmentMultiSelectComponent {
  assignmentForm = new FormGroup({
    departmentIds: new FormControl<number[]>([])
  });
  
  departmentSelectHelper = NgSelectHelper.create<Department>({
    ajaxUrl: '/api/departments/search',
    httpClient: this.httpClient
  });
  
  ngOnInit() {
    this.departmentSelectHelper
      .patchQueryParams({ includeStats: true })
      .init();
  }
}
```

## API Integration

### Expected Response Format

```typescript
interface NgSelectResponse<T> {
  data: T[];           // Array of selectable items
  hasNext: boolean;    // Whether more data is available
  totalCount?: number; // Optional total count
}
```

### Request Format

The helper sends requests with these parameters:

```typescript
interface SearchRequest {
  search?: string;     // Search term from typeahead
  page: number;        // Current page (0-based)
  size: number;        // Page size (default: 10)
  // Additional query parameters from patchQueryParams
}
```

For POST requests, the body structure is:
```typescript
{
  // Custom body from setBody()
  // Plus query parameters if specified
}
```

## NgSelectHelper Configuration

```typescript
interface NgSelectHelperConfig<TData> {
  ajaxUrl: string;                    // API endpoint URL
  httpClient: HttpClient;             // Angular HttpClient instance
  httpOptions?: any;                  // Additional HTTP options (headers, etc.)
}
```

## NgSelectHelper Methods

### Initialization & Configuration
- `static create<T>(config)` - Create new helper instance
- `init()` - Initialize the helper and load first page
- `setDebounceTimeInSecond(seconds: number)` - Set search debounce time
- `patchQueryParams(params: Record<string, any>)` - Update query parameters
- `removeQueryParam(key: string)` - Remove a query parameter
- `setBody(body: any)` - Set request body for POST requests

### Event Handlers (for ng-select events)
- `onOpen()` - Handle ng-select open event
- `onClose()` - Handle ng-select close event  
- `onClear()` - Handle ng-select clear event
- `onScrollToEnd()` - Handle infinite scroll (load next page)

### Data Management
- `refreshData()` - Refresh current data
- `clearCache()` - Clear cached responses
- `resetAll(options?)` - Reset all data with optional configuration

### Readonly Signals
- `loadedData()` - Currently loaded data array
- `isLoading()` - Loading state boolean
- `totalCount()` - Total available records
- `page()` - Current page number  
- `limitReached()` - Whether pagination limit reached
- `isLastApiCallSuccessful()` - Whether last API call succeeded

### Observables
- `ajaxError$` - Observable for API errors
- `inputSubject` - Subject for search input (connect to typeahead)

## Advanced Examples

### Dynamic URL and Parameters

```typescript
@Component({
  selector: 'app-dynamic-select'
})
export class DynamicSelectComponent {
  categorySelectHelper = NgSelectHelper.create<Category>({
    ajaxUrl: '/api/categories/search',
    httpClient: this.httpClient
  });
  
  productSelectHelper = NgSelectHelper.create<Product>({
    ajaxUrl: '/api/products/search', 
    httpClient: this.httpClient
  });
  
  selectedCategory: Category | null = null;
  
  onCategoryChange(category: Category) {
    this.selectedCategory = category;
    
    // Update product search to filter by category
    this.productSelectHelper
      .patchQueryParams({ categoryId: category.id })
      .refreshData();
  }
  
  searchByTenant(tenantId: string) {
    // Update both selects for tenant-specific data
    [this.categorySelectHelper, this.productSelectHelper].forEach(helper => {
      helper
        .patchQueryParams({ tenantId })
        .refreshData();
    });
  }
}
```

### Error Handling and Retry Logic

```typescript
@Component({
  selector: 'app-robust-select'
})
export class RobustSelectComponent {
  selectHelper = NgSelectHelper.create<User>({
    ajaxUrl: '/api/users/search',
    httpClient: this.httpClient
  });
  
  retryCount = 0;
  maxRetries = 3;
  
  ngOnInit() {
    this.selectHelper.init();
    
    // Handle errors with retry logic
    this.selectHelper.ajaxError$.subscribe(error => {
      if (this.retryCount < this.maxRetries) {
        this.retryCount++;
        console.log(`Retrying... (${this.retryCount}/${this.maxRetries})`);
        
        setTimeout(() => {
          this.selectHelper.refreshData();
        }, 1000 * this.retryCount); // Exponential backoff
      } else {
        this.showError('Failed to load data after multiple attempts');
        this.retryCount = 0;
      }
    });
  }
  
  manualRetry() {
    this.retryCount = 0;
    this.selectHelper.refreshData();
  }
}
```

### Integration with Table State Management

```typescript
@Component({
  selector: 'app-integrated-management'
})
export class IntegratedManagementComponent {
  // Table state management
  tableState = PrimeNgDynamicTableStateHelper.create<User>({
    url: '/api/users/query',
    httpClient: this.httpClient
  });
  
  // Select helpers for filters
  departmentSelect = NgSelectHelper.create<Department>({
    ajaxUrl: '/api/departments/search',
    httpClient: this.httpClient
  });
  
  roleSelect = NgSelectHelper.create<Role>({
    ajaxUrl: '/api/roles/search', 
    httpClient: this.httpClient
  });
  
  // Component state management
  componentState = new ComponentState();
  
  ngOnInit() {
    // Initialize all helpers
    initNgSelect(
      toObservable(signal([this.departmentSelect, this.roleSelect])),
      this.destroyRef,
      (error) => this.handleSelectError(error)
    );
  }
  
  filterUsersByDepartment(departmentId: number) {
    // Update table filters based on select values
    this.tableState.patchQueryParams({ departmentId });
    this.tableState.refreshData();
  }
  
  filterUsersByRole(roleId: string) {
    this.tableState.patchQueryParams({ roleId });
    this.tableState.refreshData();
  }
  
  private handleSelectError(error: any) {
    console.error('Select error:', error);
    this.toastService.showError('Failed to load options');
  }
}
```

## Best Practices

### Performance Optimization
```typescript
// Good: Set appropriate debounce time
this.selectHelper.setDebounceTimeInSecond(0.5); // 500ms

// Good: Use query parameters for filtering
this.selectHelper.patchQueryParams({ 
  status: 'active',
  limit: 20 
});

// Good: Clear cache when data changes
this.selectHelper.clearCache();
```

### Error Handling
```typescript
// Good: Subscribe to errors for user feedback
this.selectHelper.ajaxError$.subscribe(error => {
  this.notificationService.showError('Failed to load data');
});

// Good: Check API call status
if (!this.selectHelper.isLastApiCallSuccessful()) {
  // Show retry button or error message
}
```

### Memory Management
```typescript
// Good: Use centralized initialization for automatic cleanup
initNgSelect(
  toObservable(this.helpersSignal),
  this.destroyRef,
  this.handleError
);

// Good: The centralized approach automatically handles unsubscription
// No manual unsubscribe needed
```
