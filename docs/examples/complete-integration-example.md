# Complete Integration Example

This comprehensive example demonstrates how to use all features of NGX PrimeNG Toolkit together in a real-world scenario.

## User Management Dashboard

```typescript
import { Component, inject, signal, viewChild } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DestroyRef } from '@angular/core';
import { Table } from 'primeng/table';
import {
  PrimeNgDynamicTableStateHelper,
  ComponentState,
  ComponentDataStorage,
  MemoizedDataStorage,
  NgSelectHelper,
  initNgSelect,
  ManipulationType,
  createTextColumn,
  createBooleanColumn,
  createDropdownColumn,
  mergeTableHeaders,
  cleanNullishFromObject
} from 'ngx-primeng-toolkit';

interface User {
  id: number;
  name: string;
  email: string;
  departmentId: number;
  active: boolean;
  createdAt: Date;
}

interface Department {
  id: number;
  name: string;
  description: string;
}

interface Role {
  id: string;
  name: string;
  permissions: string[];
}

@Component({
  selector: 'app-user-management',
  template: `
    <div class="user-management-container">
      <!-- Header with Actions -->
      <div class="header-section">
        <h2>{{ componentState.componentTitleWithManipulationType() }}</h2>
        
        <div class="actions">
          <button 
            pButton 
            label="Create User" 
            icon="pi pi-plus"
            (click)="openCreateDialog()"
            [disabled]="componentState.isAnyAjaxOperationRunning()">
          </button>
          
          <button 
            pButton 
            label="Bulk Delete" 
            icon="pi pi-trash"
            severity="danger"
            (click)="handleBulkDelete()"
            [disabled]="!hasSelectedUsers() || componentState.isAnyAjaxOperationRunning()">
          </button>
        </div>
      </div>
      
      <!-- Filters Section -->
      <div class="filters-section">
        <div class="filter-row">
          <!-- Department Filter -->
          <div class="filter-item">
            <label>Department</label>
            <ng-select 
              [items]="departmentSelectHelper.loadedData()"
              bindLabel="name"
              bindValue="id"
              [loading]="departmentSelectHelper.isLoading()"
              [typeahead]="departmentSelectHelper.inputSubject"
              (ngModelChange)="filterByDepartment($event)"
              (open)="departmentSelectHelper.onOpen()"
              (scrollToEnd)="departmentSelectHelper.onScrollToEnd()"
              placeholder="Select department...">
            </ng-select>
          </div>
          
          <!-- Role Filter -->
          <div class="filter-item">
            <label>Role</label>
            <ng-select 
              [items]="roleSelectHelper.loadedData()"
              bindLabel="name"
              bindValue="id"
              [loading]="roleSelectHelper.isLoading()"
              [typeahead]="roleSelectHelper.inputSubject"
              (ngModelChange)="filterByRole($event)"
              (open)="roleSelectHelper.onOpen()"
              (scrollToEnd)="roleSelectHelper.onScrollToEnd()"
              placeholder="Select role...">
            </ng-select>
          </div>
          
          <!-- Status Filter -->
          <div class="filter-item">
            <label>Status</label>
            <p-dropdown 
              [options]="statusOptions"
              (ngModelChange)="filterByStatus($event)"
              placeholder="Select status">
            </p-dropdown>
          </div>
          
          <button 
            pButton 
            label="Clear Filters" 
            icon="pi pi-filter-slash"
            severity="secondary"
            (click)="clearFilters()">
          </button>
        </div>
      </div>
      
      <!-- Data Table -->
      <div class="table-section">
        <p-table 
          #dt
          [value]="tableState.data()"
          [lazy]="true"
          [loading]="tableState.isLoading() || componentState.isAnyAjaxOperationRunning()"
          [totalRecords]="tableState.totalRecords()"
          [paginator]="true"
          [rows]="15"
          [showCurrentPageReport]="true"
          [selectionMode]="componentState.hasMultipleSelection() ? 'multiple' : 'single'"
          [(selection)]="selectedUsers"
          [checkboxSelection]="componentState.enableCheckBoxSelection()"
          (onLazyLoad)="tableState.onLazyLoad($event)"
          currentPageReportTemplate="Showing {first} to {last} of {totalRecords} users">
          
          <ng-template pTemplate="header">
            <tr>
              <th *ngIf="componentState.enableCheckBoxSelection()">
                <p-tableHeaderCheckbox></p-tableHeaderCheckbox>
              </th>
              <th pSortableColumn="name">
                Name <p-sortIcon field="name"></p-sortIcon>
              </th>
              <th pSortableColumn="email">
                Email <p-sortIcon field="email"></p-sortIcon>
              </th>
              <th pSortableColumn="department.name">
                Department <p-sortIcon field="department.name"></p-sortIcon>
              </th>
              <th pSortableColumn="active">
                Status <p-sortIcon field="active"></p-sortIcon>
              </th>
              <th pSortableColumn="createdAt">
                Created <p-sortIcon field="createdAt"></p-sortIcon>
              </th>
              <th>Actions</th>
            </tr>
            
            <!-- Filter Row -->
            <tr>
              <th *ngIf="componentState.enableCheckBoxSelection()"></th>
              <th>
                <p-columnFilter 
                  type="text" 
                  field="name" 
                  placeholder="Search name">
                </p-columnFilter>
              </th>
              <th>
                <p-columnFilter 
                  type="text" 
                  field="email" 
                  placeholder="Search email">
                </p-columnFilter>
              </th>
              <th>
                <p-columnFilter 
                  type="text" 
                  field="department.name" 
                  placeholder="Search department">
                </p-columnFilter>
              </th>
              <th>
                <p-columnFilter 
                  type="boolean" 
                  field="active">
                </p-columnFilter>
              </th>
              <th>
                <p-columnFilter 
                  type="date" 
                  field="createdAt">
                </p-columnFilter>
              </th>
              <th></th>
            </tr>
          </ng-template>
          
          <ng-template pTemplate="body" let-user>
            <tr [pSelectableRow]="user">
              <td *ngIf="componentState.enableCheckBoxSelection()">
                <p-tableCheckbox [value]="user"></p-tableCheckbox>
              </td>
              <td>{{ user.name }}</td>
              <td>{{ user.email }}</td>
              <td>{{ user.department?.name || 'N/A' }}</td>
              <td>
                <p-tag 
                  [value]="user.active ? 'Active' : 'Inactive'" 
                  [severity]="user.active ? 'success' : 'secondary'">
                </p-tag>
              </td>
              <td>{{ user.createdAt | date:'short' }}</td>
              <td>
                <div class="action-buttons">
                  <button 
                    pButton 
                    icon="pi pi-eye"
                    severity="info"
                    size="small"
                    (click)="viewUser(user)"
                    pTooltip="View Details">
                  </button>
                  
                  <button 
                    pButton 
                    icon="pi pi-pencil"
                    severity="warning"
                    size="small"
                    (click)="editUser(user)"
                    pTooltip="Edit User">
                  </button>
                  
                  <button 
                    pButton 
                    icon="pi pi-trash"
                    severity="danger"
                    size="small"
                    (click)="deleteUser(user)"
                    pTooltip="Delete User">
                  </button>
                </div>
              </td>
            </tr>
          </ng-template>
          
          <ng-template pTemplate="emptymessage">
            <tr>
              <td [attr.colspan]="componentState.enableCheckBoxSelection() ? 7 : 6">
                No users found.
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>
      
      <!-- Create/Update Dialog -->
      <p-dialog 
        [visible]="componentState.isCreateOrUpdateDialogOpen()"
        [header]="getDialogTitle()"
        [modal]="true"
        [closable]="!componentState.isAnyAjaxOperationRunning()"
        [style]="{width: '450px'}"
        (onHide)="closeDialog()">
        
        <form [formGroup]="userForm" (ngSubmit)="saveUser()">
          <div class="form-field">
            <label for="name">Name *</label>
            <input 
              pInputText 
              id="name"
              formControlName="name"
              [class.ng-invalid]="userForm.get('name')?.invalid && userForm.get('name')?.touched">
            <small 
              class="p-error" 
              *ngIf="userForm.get('name')?.invalid && userForm.get('name')?.touched">
              Name is required
            </small>
          </div>
          
          <div class="form-field">
            <label for="email">Email *</label>
            <input 
              pInputText 
              id="email"
              formControlName="email"
              [class.ng-invalid]="userForm.get('email')?.invalid && userForm.get('email')?.touched">
            <small 
              class="p-error" 
              *ngIf="userForm.get('email')?.invalid && userForm.get('email')?.touched">
              Valid email is required
            </small>
          </div>
          
          <div class="form-field">
            <label for="department">Department *</label>
            <ng-select 
              [items]="departmentStorage.multipleData()"
              bindLabel="name"
              bindValue="id"
              formControlName="departmentId"
              placeholder="Select department">
            </ng-select>
          </div>
          
          <div class="form-field">
            <label for="active">Active</label>
            <p-checkbox 
              binary="true"
              formControlName="active">
            </p-checkbox>
          </div>
          
          <div class="dialog-footer">
            <button 
              type="button"
              pButton 
              label="Cancel"
              severity="secondary"
              (click)="closeDialog()"
              [disabled]="componentState.isAnyAjaxOperationRunning()">
            </button>
            
            <button 
              type="submit"
              pButton 
              [label]="componentState.isOnCreateState() ? 'Create' : 'Update'"
              [loading]="componentState.isAjaxRequestOutgoing()"
              [disabled]="userForm.invalid || componentState.isAnyAjaxOperationRunning()">
            </button>
          </div>
        </form>
      </p-dialog>
      
      <!-- Confirmation Dialog -->
      <p-confirmDialog></p-confirmDialog>
    </div>
  `,
  styles: [`
    .user-management-container {
      padding: 1rem;
    }
    
    .header-section {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }
    
    .filters-section {
      background: #f8f9fa;
      padding: 1rem;
      border-radius: 4px;
      margin-bottom: 1rem;
    }
    
    .filter-row {
      display: flex;
      gap: 1rem;
      align-items: end;
    }
    
    .filter-item {
      display: flex;
      flex-direction: column;
      min-width: 200px;
    }
    
    .filter-item label {
      font-weight: 500;
      margin-bottom: 0.5rem;
    }
    
    .action-buttons {
      display: flex;
      gap: 0.5rem;
    }
    
    .form-field {
      margin-bottom: 1rem;
    }
    
    .form-field label {
      display: block;
      font-weight: 500;
      margin-bottom: 0.5rem;
    }
    
    .dialog-footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
      margin-top: 1rem;
    }
  `]
})
export class UserManagementComponent {
  private readonly httpClient = inject(HttpClient);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly dataTableRef = viewChild.required<Table>('dt');
  
  // Component State Management
  componentState = new ComponentState();
  
  // Data Storage
  selectedDataStorage = new ComponentDataStorage<User>();
  
  // Memoized Storage for Reference Data
  departmentStorage = new MemoizedDataStorage<Department>(this.httpClient);
  roleStorage = new MemoizedDataStorage<Role>(this.httpClient);
  
  // Table State Management
  tableState = PrimeNgDynamicTableStateHelper.create<User>({
    url: '/api/users/query',
    httpClient: this.httpClient
  });
  
  // NgSelect Helpers
  departmentSelectHelper = NgSelectHelper.create<Department>({
    ajaxUrl: '/api/departments/search',
    httpClient: this.httpClient
  });
  
  roleSelectHelper = NgSelectHelper.create<Role>({
    ajaxUrl: '/api/roles/search',
    httpClient: this.httpClient
  });
  
  // Signal containing all helpers for centralized initialization
  private helpersSignal = signal([
    this.departmentSelectHelper,
    this.roleSelectHelper
  ]);
  
  // Form Management
  userForm: FormGroup;
  selectedUsers: User[] = [];
  
  // Static Options
  statusOptions = [
    { label: 'Active', value: true },
    { label: 'Inactive', value: false }
  ];
  
  // Table Configuration
  readonly tableHeaders = mergeTableHeaders(
    createTextColumn('name', 'Name', {
      sortable: true,
      filter: true,
      filterPlaceholder: 'Search by name...'
    }),
    createTextColumn('email', 'Email', {
      sortable: true,
      filter: true,
      filterPlaceholder: 'Search by email...'
    }),
    createDropdownColumn('departmentId', 'Department', {
      sortable: true,
      filter: true
    }, []),
    createBooleanColumn('active', 'Status', {
      sortable: true,
      filter: true
    })
  );
  
  constructor() {
    this.userForm = this.fb.group({
      id: [null],
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      departmentId: [null, Validators.required],
      active: [true]
    });
  }
  
  async ngOnInit() {
    await this.initializeComponent();
  }
  
  private async initializeComponent() {
    try {
      // Configure component state
      this.componentState
        .updateComponentTitle('User Management')
        .updateMultipleSelectionStatus(true)
        .updateCheckBoxSelectionStatus(true);
      
      // Configure table state
      this.tableState.setUniqueKey('id');
      
      // Initialize NgSelect helpers with centralized error handling
      initNgSelect(
        toObservable(this.helpersSignal),
        this.destroyRef,
        (error) => this.handleSelectError(error)
      );
      
      // Load reference data
      await Promise.all([
        this.departmentStorage.loadMultipleData('/api/departments'),
        this.roleStorage.loadMultipleData('/api/roles')
      ]);
      
      // Configure select helpers
      this.departmentSelectHelper.patchQueryParams({ active: true });
      this.roleSelectHelper.patchQueryParams({ includePermissions: false });
      
    } catch (error) {
      this.handleError('Failed to initialize component', error);
    }
  }
  
  // Dialog Management
  openCreateDialog() {
    this.userForm.reset({ active: true });
    this.componentState
      .updateManipulationType(ManipulationType.CREATE)
      .updateCreateOrUpdateDialogStatus(true);
  }
  
  editUser(user: User) {
    this.userForm.patchValue(user);
    this.selectedDataStorage.updateSingleData(user);
    this.componentState
      .updateManipulationType(ManipulationType.UPDATE)
      .updateCreateOrUpdateDialogStatus(true);
  }
  
  viewUser(user: User) {
    this.selectedDataStorage.updateSingleData(user);
    this.componentState
      .updateManipulationType(ManipulationType.VIEW)
      .updateCreateOrUpdateDialogStatus(true);
    // Disable form for view mode
    this.userForm.disable();
  }
  
  closeDialog() {
    this.componentState
      .updateCreateOrUpdateDialogStatus(false)
      .updateManipulationType(ManipulationType.NONE);
    this.userForm.enable();
    this.selectedDataStorage.clearSingleData();
  }
  
  getDialogTitle(): string {
    const manipulationType = this.componentState.manipulationType();
    switch (manipulationType) {
      case ManipulationType.CREATE:
        return 'Create New User';
      case ManipulationType.UPDATE:
        return 'Update User';
      case ManipulationType.VIEW:
        return 'View User Details';
      default:
        return 'User Management';
    }
  }
  
  // CRUD Operations
  async saveUser() {
    if (this.userForm.invalid) return;
    
    this.componentState.updateAjaxRequestOutgoingStatus(true);
    
    try {
      const formData = cleanNullishFromObject(this.userForm.value);
      
      if (this.componentState.isOnCreateState()) {
        await this.httpClient.post('/api/users', formData).toPromise();
        this.showSuccess('User created successfully');
      } else if (this.componentState.isOnUpdateState()) {
        const userId = this.selectedDataStorage.singleData()?.id;
        await this.httpClient.put(`/api/users/${userId}`, formData).toPromise();
        this.showSuccess('User updated successfully');
      }
      
      this.closeDialog();
      await this.tableState.refreshData();
      
    } catch (error) {
      this.handleError('Failed to save user', error);
    } finally {
      this.componentState.updateAjaxRequestOutgoingStatus(false);
    }
  }
  
  async deleteUser(user: User) {
    // Show confirmation dialog
    // Implementation depends on your confirmation service
    
    try {
      await this.httpClient.delete(`/api/users/${user.id}`).toPromise();
      this.showSuccess('User deleted successfully');
      await this.tableState.refreshData();
    } catch (error) {
      this.handleError('Failed to delete user', error);
    }
  }
  
  async handleBulkDelete() {
    if (!this.hasSelectedUsers()) return;
    
    this.componentState.updateAjaxRequestOutgoingStatus(true);
    
    try {
      const userIds = this.selectedUsers.map(u => u.id);
      await this.httpClient.post('/api/users/bulk-delete', { userIds }).toPromise();
      
      this.showSuccess(`${userIds.length} users deleted successfully`);
      this.selectedUsers = [];
      await this.tableState.refreshData();
      
    } catch (error) {
      this.handleError('Failed to delete users', error);
    } finally {
      this.componentState.updateAjaxRequestOutgoingStatus(false);
    }
  }
  
  // Filtering Methods
  filterByDepartment(departmentId: number | null) {
    if (departmentId) {
      this.tableState.patchQueryParams({ departmentId });
    } else {
      this.tableState.removeQueryParam('departmentId');
    }
    this.tableState.refreshData();
  }
  
  filterByRole(roleId: string | null) {
    if (roleId) {
      this.tableState.patchQueryParams({ roleId });
    } else {
      this.tableState.removeQueryParam('roleId');
    }
    this.tableState.refreshData();
  }
  
  filterByStatus(active: boolean | null) {
    if (active !== null) {
      this.tableState.patchQueryParams({ active });
    } else {
      this.tableState.removeQueryParam('active');
    }
    this.tableState.refreshData();
  }
  
  clearFilters() {
    this.tableState.setQueryParams({});
    this.tableState.refreshData();
    
    // Clear select values
    // Implementation depends on your select components
  }
  
  // Utility Methods
  hasSelectedUsers(): boolean {
    return this.selectedUsers && this.selectedUsers.length > 0;
  }
  
  private handleSelectError(error: any) {
    console.error('NgSelect error:', error);
    this.showError('Failed to load selection data');
  }
  
  private handleError(message: string, error: any) {
    console.error(message, error);
    this.showError(message);
  }
  
  private showSuccess(message: string) {
    // Implement using your preferred toast/notification service
    console.log('Success:', message);
  }
  
  private showError(message: string) {
    // Implement using your preferred toast/notification service
    console.error('Error:', message);
  }
}
```

## Key Features Demonstrated

### 1. **Complete State Management**
- `ComponentState` for dialog and operation management
- `ComponentDataStorage` for selected user data
- `MemoizedDataStorage` for reference data caching
- `PrimeNgDynamicTableStateHelper` for table state

### 2. **Advanced Table Features**
- Lazy loading with pagination
- Multi-column filtering and sorting
- Row selection with bulk operations
- Dynamic column configuration

### 3. **NgSelect Integration**
- Centralized initialization with error handling
- Search with debouncing
- Infinite scroll pagination
- Integration with form controls

### 4. **Form Integration**
- Reactive forms with validation
- Clean data submission using utility functions
- Dynamic form states based on operation type

### 5. **Error Handling**
- Centralized error handling for all components
- User-friendly error messages
- Loading states management

### 6. **Performance Optimizations**
- Memoized reference data loading
- Efficient state updates with signals
- Tree-shakeable imports

## Usage Notes

1. **Replace placeholder services** with your actual implementations (toast, confirmation dialog, etc.)
2. **Adjust API endpoints** to match your backend structure
3. **Customize styling** to match your design system
4. **Add validation** messages and error handling as needed
5. **Configure permissions** and security as required

This example showcases the full power of NGX PrimeNG Toolkit in a comprehensive, production-ready component.
