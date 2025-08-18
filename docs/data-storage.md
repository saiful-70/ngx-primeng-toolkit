# Data Storage

This guide covers the data storage utilities including memoized HTTP caching and component data management.

## Memoized Data Storage

The `MemoizedDataStorage` class provides intelligent caching for HTTP responses, reducing redundant API calls and improving performance.

### Basic Usage

```typescript
import { Component, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MemoizedDataStorage } from 'ngx-primeng-toolkit';

interface User {
  id: number;
  name: string;
  email: string;
}

@Component({
  selector: 'app-data-example',
  template: `
    <div>
      <div *ngIf="userStorage.isLoading()">Loading...</div>
      <div *ngIf="userStorage.singleData() as user">
        <h3>{{ user.name }}</h3>
        <p>{{ user.email }}</p>
      </div>
      <div *ngFor="let user of userStorage.multipleData()">
        {{ user.name }}
      </div>
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
    // First call fetches from API, subsequent calls use cache
    await this.configStorage.loadSingleData('/api/config');
  }
  
  async refreshConfig() {
    // Force fresh data on next load
    this.configStorage.disableMemoizationOnNextRead();
    await this.configStorage.loadSingleData('/api/config');
  }
  
  async loadCategoriesWithParams() {
    await this.categoryStorage.loadMultipleData('/api/categories', {
      page: 1,
      size: 20,
      filter: 'active'
    });
  }
  
  clearAllData() {
    this.configStorage.clear();
    this.categoryStorage.clear();
  }
}
```

### MemoizedDataStorage Methods

**Data Loading:**
- `loadSingleData(url, queryParams?)` - Loads single object with optional query parameters
- `loadMultipleData(url, queryParams?)` - Loads array of objects with optional query parameters

**Cache Management:**
- `disableMemoizationOnNextRead()` - Forces fresh data on next load call
- `clear()` - Clears all cached data
- `hasSingleData()` - Checks if single data is cached
- `hasMultipleData()` - Checks if multiple data is cached

**Readonly Signals:**
- `singleData` - Current single data object or null
- `multipleData` - Current array of data objects
- `isLoading` - Loading state boolean

## Component Data Storage

The `ComponentDataStorage<T>` class provides reactive data management for single objects and arrays with signal-based updates.

### Basic Usage

```typescript
import { Component, OnInit } from '@angular/core';
import { ComponentDataStorage } from 'ngx-primeng-toolkit';

interface User {
  id: number;
  name: string;
  email: string;
}

@Component({
  selector: 'app-user-data',
  template: `
    <div>
      <!-- Single data display -->
      <div *ngIf="dataStorage.singleData() as user">
        <h3>Selected User: {{ user.name }}</h3>
        <p>Email: {{ user.email }}</p>
      </div>
      
      <!-- Multiple data display -->
      <div *ngFor="let user of dataStorage.multipleData()">
        <p>{{ user.name }} - {{ user.email }}</p>
      </div>
      
      <p>Total users: {{ dataStorage.getMultipleDataCount() }}</p>
    </div>
  `
})
export class UserDataComponent implements OnInit {
  dataStorage = new ComponentDataStorage<User>();
  
  ngOnInit() {
    // Load initial data
    this.loadUsers();
  }
  
  loadUsers() {
    const users: User[] = [
      { id: 1, name: 'John Doe', email: 'john@example.com' },
      { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
    ];
    this.dataStorage.updateMultipleData(users);
  }
  
  selectUser(userId: number) {
    const user = this.dataStorage.findInMultipleData(u => u.id === userId);
    if (user) {
      this.dataStorage.updateSingleData(user);
    }
  }
}
```

### Advanced Data Operations

```typescript
@Component({
  selector: 'app-advanced-data-management'
})
export class AdvancedDataManagementComponent {
  userStorage = new ComponentDataStorage<User>();
  
  // Update operations
  updateUser() {
    // Complete replacement of single data
    this.userStorage.updateSingleData({
      id: 1,
      name: 'Updated Name',
      email: 'updated@example.com'
    });
    
    // Partial update (merge with existing data)
    this.userStorage.patchSingleData({
      name: 'New Name Only'
    });
  }
  
  // Array operations
  manageUsers() {
    // Add single user to array
    this.userStorage.addToMultipleData({
      id: 3,
      name: 'New User',
      email: 'newuser@example.com'
    });
    
    // Add multiple users
    this.userStorage.patchMultipleData([
      { id: 4, name: 'User 4', email: 'user4@example.com' },
      { id: 5, name: 'User 5', email: 'user5@example.com' }
    ]);
    
    // Remove users by condition
    this.userStorage.removeFromMultipleData(user => user.id > 3);
    
    // Update specific users
    this.userStorage.updateItemInMultipleData(
      user => user.id === 2,
      user => ({ ...user, name: 'Updated Name' })
    );
  }
  
  // Search and validation
  searchOperations() {
    // Check if specific user exists
    const hasActiveUser = this.userStorage.existsInMultipleData(
      user => user.email.includes('active')
    );
    
    // Find specific user
    const adminUser = this.userStorage.findInMultipleData(
      user => user.name.includes('Admin')
    );
    
    // Check data availability
    if (this.userStorage.hasSingleData()) {
      console.log('Single user selected');
    }
    
    if (this.userStorage.hasMultipleData()) {
      console.log(`Total users: ${this.userStorage.getMultipleDataCount()}`);
    }
  }
  
  // Cleanup operations
  cleanup() {
    this.userStorage.clearSingleData();
    this.userStorage.clearMultipleData();
    // or clear everything at once
    this.userStorage.clearAll();
  }
}
```

### ComponentDataStorage Methods

**Data Update Methods:**
- `updateSingleData(data)` - Replace single data completely
- `updateMultipleData(array)` - Replace multiple data array
- `patchSingleData(partial)` - Merge partial data with existing single data
- `patchMultipleData(array)` - Append new items to existing array
- `addToMultipleData(item)` - Add single item to array
- `removeFromMultipleData(predicate)` - Remove items matching predicate
- `updateItemInMultipleData(predicate, updateFn)` - Update specific items

**Utility Methods:**
- `clearAll()` - Clear both single and multiple data
- `clearSingleData()` - Clear only single data
- `clearMultipleData()` - Clear only multiple data
- `hasSingleData()` - Check if single data exists
- `hasMultipleData()` - Check if multiple data has items
- `getMultipleDataCount()` - Get count of multiple data items
- `findInMultipleData(predicate)` - Find item in multiple data
- `existsInMultipleData(predicate)` - Check if item exists

**Readonly Signals:**
- `singleData` - Current single data object or null
- `multipleData` - Current array of data objects

## Integration Example

Here's how to combine both storage types in a complex component:

```typescript
@Component({
  selector: 'app-integrated-data-management'
})
export class IntegratedDataManagementComponent {
  private httpClient = inject(HttpClient);
  
  // HTTP-based storage for API data
  userApiStorage = new MemoizedDataStorage<User>(this.httpClient);
  categoryApiStorage = new MemoizedDataStorage<Category>(this.httpClient);
  
  // Component storage for UI state
  selectedDataStorage = new ComponentDataStorage<User>();
  cartStorage = new ComponentDataStorage<CartItem>();
  
  async ngOnInit() {
    // Load reference data from API (cached)
    await this.categoryApiStorage.loadMultipleData('/api/categories');
    
    // Load users from API (cached)
    await this.userApiStorage.loadMultipleData('/api/users');
  }
  
  selectUser(user: User) {
    // Store selected user in component storage
    this.selectedDataStorage.updateSingleData(user);
  }
  
  addToCart(item: CartItem) {
    // Add item to local cart storage
    this.cartStorage.addToMultipleData(item);
  }
  
  async refreshUserData() {
    // Force refresh of cached user data
    this.userApiStorage.disableMemoizationOnNextRead();
    await this.userApiStorage.loadMultipleData('/api/users');
  }
}
```

## Best Practices

### When to Use MemoizedDataStorage
- API responses that don't change frequently
- Reference data (categories, statuses, etc.)
- User profile information
- Configuration data

### When to Use ComponentDataStorage
- UI state management
- Selected items or forms
- Shopping cart or temporary data
- Data that needs frequent updates

### Performance Tips
- Use `disableMemoizationOnNextRead()` instead of `clear()` for selective cache refresh
- Clear cache when you know data has changed on the server
- Use separate storage instances for different data types
- Combine both storage types for optimal performance
