import { computed, signal } from "@angular/core";
import { ManipulationType } from "./types";

/**
 * A reactive state management class for Angular components using signals
 * Provides common component state properties and computed values
 * 
 * @example
 * ```typescript
 * @Component({
 *   selector: 'app-user-management',
 *   template: `
 *     <h2>{{ componentState.componentTitleWithManipulationType() }}</h2>
 *     <p-button 
 *       [loading]="componentState.isAnyAjaxOperationRunning()"
 *       [disabled]="componentState.isAnyAjaxOperationRunning()">
 *       Save
 *     </p-button>
 *   `
 * })
 * export class UserManagementComponent {
 *   componentState = new ComponentState()
 *     .updateComponentTitle('User')
 *     .updateCheckBoxSelectionStatus(true);
 * }
 * ```
 */
export class ComponentState {
  readonly isAjaxDataIncoming = signal<boolean>(false);
  readonly enableCheckBoxSelection = signal<boolean>(false);
  readonly isSelectableRowEnabled = signal<boolean>(false);
  readonly isAjaxRequestOutgoing = signal<boolean>(false);
  readonly hasMultipleSelection = signal<boolean>(false);
  readonly isCreateOrUpdateDialogOpen = signal<boolean>(false);
  readonly isUpdateDialogOpen = signal<boolean>(false);
  readonly isCreateDialogOpen = signal<boolean>(false);
  readonly manipulationType = signal<ManipulationType>(ManipulationType.Create);
  readonly componentTitle = signal<string>("");

  /**
   * Updates the component title
   * @param componentTitle - The new title for the component
   * @returns This instance for method chaining
   */
  updateComponentTitle = (componentTitle: string) => {
    this.componentTitle.set(componentTitle);
    return this;
  };

  /**
   * Updates the multiple selection status
   * @param newStatus - Whether multiple selection is enabled
   * @returns This instance for method chaining
   */
  updateMultipleSelectionStatus = (newStatus: boolean) => {
    this.hasMultipleSelection.set(newStatus);
    return this;
  };

  /**
   * Updates the checkbox selection status
   * @param newStatus - Whether checkbox selection is enabled
   * @returns This instance for method chaining
   */
  updateCheckBoxSelectionStatus = (newStatus: boolean) => {
    this.enableCheckBoxSelection.set(newStatus);
    return this;
  };

  /**
   * Updates the selectable row status
   * @param newStatus - Whether row selection is enabled
   * @returns This instance for method chaining
   */
  updateSelectableRowStatus = (newStatus: boolean) => {
    this.isSelectableRowEnabled.set(newStatus);
    return this;
  };

  /**
   * Updates the manipulation type (Create, Update, Delete, View)
   * @param type - The manipulation type
   * @returns This instance for method chaining
   */
  updateManipulationType = (type: ManipulationType) => {
    this.manipulationType.set(type);
    return this;
  };

  /**
   * Sets the incoming Ajax data status
   * @param status - Whether Ajax data is incoming
   * @returns This instance for method chaining
   */
  setAjaxDataIncoming = (status: boolean) => {
    this.isAjaxDataIncoming.set(status);
    return this;
  };

  /**
   * Sets the outgoing Ajax request status
   * @param status - Whether Ajax request is outgoing
   * @returns This instance for method chaining
   */
  setAjaxRequestOutgoing = (status: boolean) => {
    this.isAjaxRequestOutgoing.set(status);
    return this;
  };

  /**
   * Sets the create or update dialog open status
   * @param status - Whether the dialog is open
   * @returns This instance for method chaining
   */
  setCreateOrUpdateDialogOpen = (status: boolean) => {
    this.isCreateOrUpdateDialogOpen.set(status);
    return this;
  };

  /**
   * Sets the update dialog open status
   * @param status - Whether the update dialog is open
   * @returns This instance for method chaining
   */
  setUpdateDialogOpen = (status: boolean) => {
    this.isUpdateDialogOpen.set(status);
    return this;
  };

  /**
   * Sets the create dialog open status
   * @param status - Whether the create dialog is open
   * @returns This instance for method chaining
   */
  setCreateDialogOpen = (status: boolean) => {
    this.isCreateDialogOpen.set(status);
    return this;
  };

  /**
   * Computed signal that combines component title with manipulation type
   */
  readonly componentTitleWithManipulationType = computed(() => {
    return this.manipulationType() + " " + this.componentTitle();
  });

  /**
   * Computed signal that indicates if component is in update state
   */
  readonly isOnUpdateState = computed(() => {
    return this.manipulationType() === ManipulationType.Update;
  });

  /**
   * Computed signal that indicates if component is in create state
   */
  readonly isOnCreateState = computed(() => {
    return this.manipulationType() === ManipulationType.Create;
  });

  /**
   * Computed signal that indicates if component is in delete state
   */
  readonly isOnDeleteState = computed(() => {
    return this.manipulationType() === ManipulationType.Delete;
  });

  /**
   * Computed signal that indicates if component is in view state
   */
  readonly isOnViewState = computed(() => {
    return this.manipulationType() === ManipulationType.View;
  });

  /**
   * Computed signal that indicates if any Ajax operation is currently running
   */
  readonly isAnyAjaxOperationRunning = computed(() => {
    return this.isAjaxDataIncoming() || this.isAjaxRequestOutgoing();
  });

  /**
   * Computed signal that indicates if any dialog is open
   */
  readonly isAnyDialogOpen = computed(() => {
    return this.isCreateOrUpdateDialogOpen() || this.isUpdateDialogOpen() || this.isCreateDialogOpen();
  });

  /**
   * Resets all state to default values
   * @returns This instance for method chaining
   */
  reset = () => {
    this.isAjaxDataIncoming.set(false);
    this.enableCheckBoxSelection.set(false);
    this.isSelectableRowEnabled.set(false);
    this.isAjaxRequestOutgoing.set(false);
    this.hasMultipleSelection.set(false);
    this.isCreateOrUpdateDialogOpen.set(false);
    this.isUpdateDialogOpen.set(false);
    this.isCreateDialogOpen.set(false);
    this.manipulationType.set(ManipulationType.Create);
    this.componentTitle.set("");
    return this;
  };
}
