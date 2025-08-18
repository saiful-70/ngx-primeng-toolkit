# Component State Management

This guide covers reactive state management for UI components using Angular signals.

## ComponentState

The `ComponentState` class provides comprehensive reactive state management for common component operations like dialogs, loading states, and CRUD operations.

### Basic Usage

```typescript
import { Component } from '@angular/core';
import { ComponentState, ManipulationType } from 'ngx-primeng-toolkit';

@Component({
  selector: 'app-user-management',
  template: `
    <div>
      <h2>{{ componentState.componentTitleWithManipulationType() }}</h2>
      
      <!-- Loading indicator -->
      <div *ngIf="componentState.isAnyAjaxOperationRunning()">
        Loading...
      </div>
      
      <!-- Action buttons -->
      <button (click)="openCreateDialog()" 
              [disabled]="componentState.isAnyAjaxOperationRunning()">
        Create User
      </button>
      
      <button (click)="openUpdateDialog()" 
              [disabled]="!selectedUser || componentState.isAnyAjaxOperationRunning()">
        Update User
      </button>
      
      <!-- Create/Update Dialog -->
      <p-dialog [visible]="componentState.isCreateOrUpdateDialogOpen()" 
                [header]="getDialogTitle()"
                (onHide)="closeDialog()">
        <div *ngIf="componentState.isOnCreateState()">
          <!-- Create form content -->
        </div>
        <div *ngIf="componentState.isOnUpdateState()">
          <!-- Update form content -->
        </div>
      </p-dialog>
      
      <!-- Data table with selection -->
      <p-table [value]="users" 
               [(selection)]="selectedUser"
               [selectionMode]="componentState.hasMultipleSelection() ? 'multiple' : 'single'"
               [checkboxSelection]="componentState.enableCheckBoxSelection()">
        <!-- table content -->
      </p-table>
    </div>
  `
})
export class UserManagementComponent {
  componentState = new ComponentState();
  users: User[] = [];
  selectedUser: User | null = null;
  
  ngOnInit() {
    this.componentState
      .updateComponentTitle('User Management')
      .updateMultipleSelectionStatus(false)
      .updateCheckBoxSelectionStatus(true);
  }
  
  openCreateDialog() {
    this.componentState
      .updateManipulationType(ManipulationType.CREATE)
      .updateCreateOrUpdateDialogStatus(true);
  }
  
  openUpdateDialog() {
    if (!this.selectedUser) return;
    
    this.componentState
      .updateManipulationType(ManipulationType.UPDATE)
      .updateCreateOrUpdateDialogStatus(true);
  }
  
  closeDialog() {
    this.componentState
      .updateCreateOrUpdateDialogStatus(false)
      .updateManipulationType(ManipulationType.NONE);
  }
  
  getDialogTitle(): string {
    return this.componentState.isOnCreateState() ? 'Create User' : 'Update User';
  }
  
  async saveUser() {
    this.componentState.updateAjaxRequestOutgoingStatus(true);
    
    try {
      if (this.componentState.isOnCreateState()) {
        await this.userService.createUser(this.userForm.value);
      } else {
        await this.userService.updateUser(this.selectedUser!.id, this.userForm.value);
      }
      
      this.closeDialog();
      await this.refreshUserList();
    } catch (error) {
      // Handle error
    } finally {
      this.componentState.updateAjaxRequestOutgoingStatus(false);
    }
  }
}
```

### Advanced State Management

```typescript
@Component({
  selector: 'app-advanced-component-state'
})
export class AdvancedComponentStateComponent {
  componentState = new ComponentState();
  
  ngOnInit() {
    // Configure multiple aspects at once using fluent API
    this.componentState
      .updateComponentTitle('Product Management')
      .updateMultipleSelectionStatus(true)
      .updateCheckBoxSelectionStatus(true)
      .updateSelectableRowStatus(true);
  }
  
  // Handle different manipulation types
  handleViewOperation(item: any) {
    this.componentState
      .updateManipulationType(ManipulationType.VIEW)
      .updateCreateOrUpdateDialogStatus(true);
    // Load read-only view
  }
  
  handleDeleteOperation(item: any) {
    this.componentState.updateManipulationType(ManipulationType.DELETE);
    // Show confirmation dialog
  }
  
  // Handle bulk operations
  async handleBulkDelete() {
    if (!this.componentState.hasMultipleSelection()) return;
    
    this.componentState.updateAjaxRequestOutgoingStatus(true);
    
    try {
      await this.performBulkDelete();
    } finally {
      this.componentState.updateAjaxRequestOutgoingStatus(false);
    }
  }
  
  // Handle data loading states
  async loadData() {
    this.componentState.updateAjaxDataIncomingStatus(true);
    
    try {
      const data = await this.dataService.getData();
      // Process data
    } finally {
      this.componentState.updateAjaxDataIncomingStatus(false);
    }
  }
}
```

## ComponentState Properties

### Writable Signals
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

### Computed Signals
- `componentTitleWithManipulationType()` - Title combined with operation type
- `isOnUpdateState()` - True if in update mode
- `isOnCreateState()` - True if in create mode  
- `isOnDeleteState()` - True if in delete mode
- `isOnViewState()` - True if in view mode
- `isAnyAjaxOperationRunning()` - True if any Ajax operation is active
- `isAnyDialogOpen()` - True if any dialog is open

## ComponentState Methods

All methods return `this` for fluent API chaining:

### Dialog Management
- `updateCreateOrUpdateDialogStatus(status: boolean)` - Set generic dialog state
- `updateCreateDialogStatus(status: boolean)` - Set create dialog state
- `updateUpdateDialogStatus(status: boolean)` - Set update dialog state

### Ajax State Management  
- `updateAjaxDataIncomingStatus(status: boolean)` - Set incoming data loading state
- `updateAjaxRequestOutgoingStatus(status: boolean)` - Set outgoing request state

### Selection Management
- `updateCheckBoxSelectionStatus(status: boolean)` - Enable/disable checkbox selection
- `updateSelectableRowStatus(status: boolean)` - Enable/disable row selection
- `updateMultipleSelectionStatus(status: boolean)` - Set multiple selection mode

### Operation Management
- `updateManipulationType(type: ManipulationType)` - Set current operation type
- `updateComponentTitle(title: string)` - Set component title

## ManipulationType Enum

```typescript
export enum ManipulationType {
  NONE = 'NONE',
  CREATE = 'CREATE',
  UPDATE = 'UPDATE', 
  DELETE = 'DELETE',
  VIEW = 'VIEW'
}
```

## Integration with Forms

```typescript
@Component({
  selector: 'app-form-integration'
})
export class FormIntegrationComponent {
  componentState = new ComponentState();
  userForm: FormGroup;
  
  constructor(private fb: FormBuilder) {
    this.userForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]]
    });
  }
  
  openCreateForm() {
    this.userForm.reset();
    this.componentState
      .updateManipulationType(ManipulationType.CREATE)
      .updateCreateDialogStatus(true);
  }
  
  openUpdateForm(user: User) {
    this.userForm.patchValue(user);
    this.componentState
      .updateManipulationType(ManipulationType.UPDATE)
      .updateUpdateDialogStatus(true);
  }
  
  async submitForm() {
    if (this.userForm.invalid) return;
    
    this.componentState.updateAjaxRequestOutgoingStatus(true);
    
    try {
      const formData = this.userForm.value;
      
      if (this.componentState.isOnCreateState()) {
        await this.userService.createUser(formData);
      } else if (this.componentState.isOnUpdateState()) {
        await this.userService.updateUser(this.selectedUser.id, formData);
      }
      
      this.closeAllDialogs();
      await this.refreshData();
    } catch (error) {
      this.handleError(error);
    } finally {
      this.componentState.updateAjaxRequestOutgoingStatus(false);
    }
  }
  
  closeAllDialogs() {
    this.componentState
      .updateCreateDialogStatus(false)
      .updateUpdateDialogStatus(false)
      .updateCreateOrUpdateDialogStatus(false)
      .updateManipulationType(ManipulationType.NONE);
  }
}
```

## Best Practices

### State Organization
```typescript
// Good: Use computed signals for derived state
get isFormDisabled() {
  return this.componentState.isAnyAjaxOperationRunning() || 
         this.componentState.manipulationType() === ManipulationType.VIEW;
}

// Good: Use fluent API for multiple updates
this.componentState
  .updateComponentTitle('User Management')
  .updateMultipleSelectionStatus(true)
  .updateCheckBoxSelectionStatus(false);
```

### Error Handling
```typescript
async performOperation() {
  this.componentState.updateAjaxRequestOutgoingStatus(true);
  
  try {
    await this.apiCall();
  } catch (error) {
    // Handle error but don't update loading state here
    this.showErrorMessage(error);
  } finally {
    // Always reset loading state in finally block
    this.componentState.updateAjaxRequestOutgoingStatus(false);
  }
}
```

### Dialog Management
```typescript
// Good: Centralized dialog closing
closeAllDialogs() {
  this.componentState
    .updateCreateOrUpdateDialogStatus(false)
    .updateManipulationType(ManipulationType.NONE);
  
  // Reset form if needed
  this.form.reset();
}

// Good: Consistent dialog opening pattern
openDialog(type: ManipulationType, data?: any) {
  this.componentState
    .updateManipulationType(type)
    .updateCreateOrUpdateDialogStatus(true);
  
  if (data && type === ManipulationType.UPDATE) {
    this.form.patchValue(data);
  } else {
    this.form.reset();
  }
}
```
