# Utility Functions & TypeScript Types

This guide covers the general utility functions and TypeScript helper types for common development tasks.

## Object Utilities

### cleanNullishFromObject

Removes null and undefined values from an object, useful for cleaning query parameters before API calls.

```typescript
import { cleanNullishFromObject } from 'ngx-primeng-toolkit';

// Basic usage
const queryParams = {
  name: 'John',
  age: null,
  status: 'active',
  department: undefined,
  email: ''
};

const cleaned = cleanNullishFromObject(queryParams);
// Result: { name: 'John', status: 'active', email: '' }

// With array values
const filters = {
  categories: ['tech', 'business'],
  tags: null,
  active: true,
  archived: undefined
};

const cleanedFilters = cleanNullishFromObject(filters);
// Result: { categories: ['tech', 'business'], active: true }
```

### Practical Usage Examples

```typescript
// In API service for cleaning query parameters
export class ApiService {
  searchUsers(filters: UserSearchFilters) {
    const cleanFilters = cleanNullishFromObject(filters);
    return this.http.get('/api/users', { params: cleanFilters });
  }
}

// In component for form data
export class UserSearchComponent {
  searchForm = new FormGroup({
    name: new FormControl(''),
    department: new FormControl(null),
    status: new FormControl(null),
    startDate: new FormControl(null)
  });
  
  search() {
    const formData = this.searchForm.value;
    const cleanData = cleanNullishFromObject(formData);
    // Only sends non-null/undefined values to API
    this.userService.searchUsers(cleanData);
  }
}

// In table state helper integration
export class UserTableComponent {
  applyFilters() {
    const filters = {
      department: this.selectedDepartment,
      status: this.selectedStatus,
      dateRange: this.dateFilter // might be null
    };
    
    const cleanFilters = cleanNullishFromObject(filters);
    this.tableState.patchQueryParams(cleanFilters);
  }
}
```

## TypeScript Utility Types

The library provides several utility types for handling nullable and partial types:

### RecursiveNullable<T>

Makes all properties of a type nullable (T | null):

```typescript
import { RecursiveNullable } from 'ngx-primeng-toolkit';

type User = {
  id: number;
  name: string;
  email: string;
  profile: {
    age: number;
    bio: string;
  };
};

type NullableUser = RecursiveNullable<User>;
// Result: {
//   id: number | null;
//   name: string | null;
//   email: string | null;
//   profile: {
//     age: number | null;
//     bio: string | null;
//   } | null;
// }

// Practical usage in form models
export class UserFormComponent {
  // Form model that allows null values
  userForm: FormGroup<{
    name: FormControl<string | null>;
    email: FormControl<string | null>;
    profile: FormGroup<{
      age: FormControl<number | null>;
      bio: FormControl<string | null>;
    }>;
  }>;
  
  // Default form state with nulls
  defaultUser: RecursiveNullable<User> = {
    id: null,
    name: null,
    email: null,
    profile: {
      age: null,
      bio: null
    }
  };
  
  resetForm() {
    this.userForm.patchValue(this.defaultUser);
  }
}
```

### Nullish<T>

Represents a value that can be null or undefined:

```typescript
import { Nullish } from 'ngx-primeng-toolkit';

type MaybeString = Nullish<string>; // string | null | undefined
type MaybeUser = Nullish<User>; // User | null | undefined

// Useful for optional service responses
export class UserService {
  getCurrentUser(): Observable<Nullish<User>> {
    return this.http.get<User>('/api/user/current')
      .pipe(
        catchError(() => of(null))
      );
  }
  
  findUser(id: number): Promise<Nullish<User>> {
    return this.http.get<User>(`/api/users/${id}`)
      .pipe(
        catchError(() => of(undefined))
      )
      .toPromise();
  }
}

// In components
export class UserProfileComponent {
  currentUser: Nullish<User> = null;
  
  async loadUser() {
    this.currentUser = await this.userService.getCurrentUser();
    
    // Type-safe null checking
    if (this.currentUser) {
      console.log(`Welcome ${this.currentUser.name}`);
    }
  }
}
```

### RecursiveNullish<T>

Makes all properties nullish (T | null | undefined) recursively:

```typescript
import { RecursiveNullish } from 'ngx-primeng-toolkit';

type User = {
  id: number;
  profile: {
    name: string;
    age: number;
  };
  settings: {
    theme: string;
    notifications: boolean;
  };
};

type NullishUser = RecursiveNullish<User>;
// Result: {
//   id: number | null | undefined;
//   profile: {
//     name: string | null | undefined;
//     age: number | null | undefined;
//   } | null | undefined;
//   settings: {
//     theme: string | null | undefined;
//     notifications: boolean | null | undefined;
//   } | null | undefined;
// }

// Useful for deeply nullable form states
export interface FormState extends RecursiveNullish<User> {}

export class UserFormComponent {
  formState: FormState = {
    id: undefined,
    profile: {
      name: null,
      age: undefined
    },
    settings: null
  };
  
  // Type-safe form reset
  resetForm() {
    this.formState = {
      id: undefined,
      profile: undefined,
      settings: undefined
    };
  }
}
```

### RecursivePartial<T>

Makes all properties optional recursively:

```typescript
import { RecursivePartial } from 'ngx-primeng-toolkit';

type User = {
  id: number;
  name: string;
  profile: {
    age: number;
    bio: string;
  };
  settings: {
    theme: string;
    notifications: boolean;
  };
};

type PartialUser = RecursivePartial<User>;
// Result: {
//   id?: number;
//   name?: string;
//   profile?: {
//     age?: number;
//     bio?: string;
//   };
//   settings?: {
//     theme?: string;
//     notifications?: boolean;
//   };
// }

// Perfect for update operations
export class UserService {
  updateUser(id: number, updates: RecursivePartial<User>) {
    return this.http.patch(`/api/users/${id}`, updates);
  }
  
  updateUserProfile(id: number, profileUpdates: RecursivePartial<User['profile']>) {
    return this.http.patch(`/api/users/${id}/profile`, profileUpdates);
  }
}

// Usage in components
export class UserProfileComponent {
  updateProfile() {
    // Only send changed fields
    const updates: RecursivePartial<User> = {
      profile: {
        age: this.newAge, // Only age is being updated
        // bio is omitted, won't be sent to API
      }
      // Other fields omitted, won't be updated
    };
    
    this.userService.updateUser(this.userId, updates);
  }
  
  updateSettings() {
    const settingsUpdate: RecursivePartial<User> = {
      settings: {
        theme: 'dark' // Only update theme
        // notifications is omitted
      }
    };
    
    this.userService.updateUser(this.userId, settingsUpdate);
  }
}
```

## Combining Utilities

These utilities work great together for complex form and API scenarios:

```typescript
import { 
  cleanNullishFromObject, 
  RecursiveNullish, 
  RecursivePartial 
} from 'ngx-primeng-toolkit';

export class AdvancedFormComponent {
  // Form model with nullable fields
  formData: RecursiveNullish<User> = {
    id: null,
    name: null,
    email: null,
    profile: {
      age: null,
      bio: null
    }
  };
  
  // Update model with partial data
  updatePartial(updates: RecursivePartial<User>) {
    // Merge updates into form data
    this.formData = { ...this.formData, ...updates };
  }
  
  // Submit form with cleaned data
  async submitForm() {
    // Remove null/undefined values before API call
    const cleanData = cleanNullishFromObject(this.formData);
    
    try {
      await this.userService.updateUser(cleanData);
      this.showSuccess('User updated successfully');
    } catch (error) {
      this.showError('Failed to update user');
    }
  }
  
  // Reset form to nullable defaults
  resetForm() {
    this.formData = {
      id: null,
      name: null,
      email: null,
      profile: null
    };
  }
}
```

## Advanced Usage Examples

### API Query Builder

```typescript
export class ApiQueryBuilder {
  private filters: RecursiveNullish<any> = {};
  
  setFilter<T>(key: string, value: Nullish<T>) {
    this.filters[key] = value;
    return this;
  }
  
  build(): Record<string, any> {
    return cleanNullishFromObject(this.filters);
  }
  
  reset() {
    this.filters = {};
    return this;
  }
}

// Usage
const queryBuilder = new ApiQueryBuilder()
  .setFilter('name', 'John')
  .setFilter('department', null) // Will be removed
  .setFilter('active', true)
  .setFilter('startDate', undefined); // Will be removed

const cleanQuery = queryBuilder.build();
// Result: { name: 'John', active: true }
```

### Form Data Processor

```typescript
export class FormDataProcessor<T> {
  static processFormData<T>(
    formValue: RecursiveNullish<T>,
    options: {
      removeNullish?: boolean;
      defaultValues?: RecursivePartial<T>;
    } = {}
  ): RecursivePartial<T> {
    let processed = { ...formValue };
    
    // Apply default values
    if (options.defaultValues) {
      processed = { ...options.defaultValues, ...processed };
    }
    
    // Remove null/undefined if requested
    if (options.removeNullish) {
      processed = cleanNullishFromObject(processed);
    }
    
    return processed;
  }
}

// Usage in component
export class UserFormComponent {
  submitForm() {
    const processedData = FormDataProcessor.processFormData(
      this.userForm.value,
      {
        removeNullish: true,
        defaultValues: {
          settings: {
            theme: 'light'
          }
        }
      }
    );
    
    this.userService.createUser(processedData);
  }
}
```

## Best Practices

### Type Safety
```typescript
// Good: Use specific utility types for different scenarios
interface CreateUserRequest extends RecursivePartial<User> {}
interface UpdateUserRequest extends RecursivePartial<User> {}
interface UserFormState extends RecursiveNullish<User> {}

// Good: Combine utilities for complex scenarios
function processApiData<T>(data: RecursiveNullish<T>): RecursivePartial<T> {
  return cleanNullishFromObject(data);
}
```

### Performance Considerations
```typescript
// Good: Clean data before API calls to reduce payload size
const cleanPayload = cleanNullishFromObject(formData);
this.http.post('/api/users', cleanPayload);

// Good: Use utility types to prevent unnecessary data in requests
interface UserUpdatePayload extends RecursivePartial<Pick<User, 'name' | 'email'>> {}
```

### Form Integration
```typescript
// Good: Use utility types for form models
export class FormComponent {
  private formModel: RecursiveNullish<User> = {};
  
  updateForm(updates: RecursivePartial<User>) {
    Object.assign(this.formModel, updates);
  }
  
  getCleanFormData(): RecursivePartial<User> {
    return cleanNullishFromObject(this.formModel);
  }
}
```
