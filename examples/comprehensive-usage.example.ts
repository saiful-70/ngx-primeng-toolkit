// @ts-nocheck
/**
 * Comprehensive Example Usage of primeng-table-state-helper
 * 
 * This example demonstrates both table state helpers and all complementary utilities
 * in a real-world Angular component scenario based on the actual usage patterns.
 * 
 * NOTE: This is an example file only. The imports may show errors since Angular 
 * dependencies are peer dependencies. This file is for documentation purposes 
 * and is excluded from compilation.
 * 
 * @author PrimeNG Table State Helper Package
 * @version 1.0.0
 */

import { Component, inject, OnInit, viewChild, signal, computed, input } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, Validators } from '@angular/forms';
import { DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Table } from 'primeng/table';

// Import all helper classes and utilities
import { 
  PrimeNgDynamicTableStateHelper,
  PrimengPagedDataTableStateHelper,
  MemoizedDataStorage,
  ComponentDataStorage,
  ComponentState,
  NgSelectHelper,
  createTextColumn,
  createNumericColumn,
  createBooleanColumn,
  createDateColumn,
  createPrimengStringMatchModes,
  createPrimengNumberMatchModes,
  PrimeNgTableHeader,
  SkipLoadingSpinner
} from 'primeng-table-state-helper';

// Example data models (based on the real usage)
interface MachineProfile {
  id: number;
  sewingMachineSpecificationId: number;
  sewingMachineSpecificationDescription: string;
  machineCode: string;
  machineModel: string;
  machineSerial: string;
  machineLocationId: number | null;
  machineLocationName: string | null;
  machineDescription: string | null;
  referenceBrandId: number;
  referenceBrandName: string;
  purchasedOnUtc: string | null;
  isRented: boolean;
  refMachineStatusId: number;
  refMachineStatusName: string;
  createdById: number;
  createdByUserName: string;
  updatedById: number | null;
  updatedByUserName: string | null;
  createdAtUtc: string;
  updatedAtUtc: string | null;
}

interface KeyData<K, V> {
  key: K;
  data: V; // Note: using 'data' instead of 'value' as per real usage
}

interface ReferenceDataDetail {
  id: number;
  title: string;
  value: string;
}

interface MachineSpec {
  id: number;
  description: string;
}

@Component({
  selector: 'app-machine-profile-example',
  template: `
    <div class="p-6">
      <h1 class="text-3xl font-bold mb-8">Machine Profile Management</h1>

      <!-- Toolbar Section -->
      <p-toolbar class="mb-4">
        <ng-template #start>
          <h2 class="font-semibold md:text-lg">
            {{ componentState.componentTitle() }} : {{ selectedMachineSpec().description }}
          </h2>
        </ng-template>
        <ng-template #end>
          <div class="flex gap-2">
            <p-button
              (onClick)="openCreateDialog()"
              [disabled]="!hasCreatePermission()"
              icon="pi pi-plus"
              raised
              size="small" />
            <p-button
              icon="pi pi-refresh"
              raised
              size="small"
              [disabled]="!hasReadPermission()"
              (onClick)="dynamicTableHelper.clearTableData(dataTableRef())" />
          </div>
        </ng-template>
      </p-toolbar>

      <!-- Dynamic Table with Advanced Features -->
      <div class="mb-8">
        <h3 class="text-xl font-semibold mb-4">Advanced Table (Filtering & Sorting)</h3>
        
        <p-table
          #dt
          [value]="dynamicTableHelper.data()"
          stripedRows
          showGridlines
          selectionMode="single"
          [selection]="componentData.singleData()"
          (selectionChange)="componentData.singleData.set($event)"
          [metaKeySelection]="false"
          [loading]="dynamicTableHelper.isLoading()"
          [resetPageOnSort]="false"
          [lazy]="true"
          [rowHover]="true"
          [resizableColumns]="true"
          [dataKey]="dynamicTableHelper.uniqueKey()"
          [scrollable]="true"
          scrollHeight="70vh"
          [paginator]="true"
          [pageLinks]="5"
          [customSort]="true"
          (onLazyLoad)="dynamicTableHelper.onLazyLoad($event)"
          [totalRecords]="dynamicTableHelper.totalRecords()"
          [rows]="15"
          [rowsPerPageOptions]="[15, 25, 50]"
          [tableStyle]="{ 'min-width': '50rem' }"
          size="small">
          
          <ng-template #header>
            <tr>
              <th style="width: 4rem">Option</th>
              @for (header of tableHeaders(); track header.identifier.field) {
                <th [pSortableColumn]="header.identifier.hasSort !== false ? header.identifier.field : null"
                    [style]="header.identifier.styleClass">
                  {{ header.identifier.label }}
                  @if (header.identifier.hasSort !== false) {
                    <p-sortIcon [field]="header.identifier.field"></p-sortIcon>
                  }
                </th>
              }
            </tr>
            <tr>
              <th></th>
              @for (header of tableHeaders(); track header.identifier.field) {
                @if (header.filter) {
                  <th [attr.colspan]="header.filter.colspan || 1">
                    @switch (header.filter.type) {
                      @case ('text') {
                        <p-columnFilter 
                          [type]="header.filter.type"
                          [field]="header.identifier.field"
                          [matchModeOptions]="header.filter.matchModeOptions || stringMatchModes"
                          [placeholder]="header.filter.placeholder">
                        </p-columnFilter>
                      }
                      @case ('numeric') {
                        <p-columnFilter 
                          [type]="header.filter.type"
                          [field]="header.identifier.field"
                          [matchModeOptions]="header.filter.matchModeOptions || numberMatchModes"
                          [placeholder]="header.filter.placeholder">
                        </p-columnFilter>
                      }
                      @case ('boolean') {
                        <p-columnFilter 
                          [type]="header.filter.type"
                          [field]="header.identifier.field">
                        </p-columnFilter>
                      }
                      @case ('date') {
                        <p-columnFilter 
                          [type]="header.filter.type"
                          [field]="header.identifier.field">
                        </p-columnFilter>
                      }
                    }
                  </th>
                } @else {
                  <th></th>
                }
              }
            </tr>
          </ng-template>

          <ng-template #body let-entity>
            <tr [pSelectableRow]="entity">
              <td>
                <p-button icon="pi pi-pencil" 
                          size="small" 
                          (onClick)="openUpdateDialog(entity)"
                          [disabled]="!hasUpdatePermission()">
                </p-button>
              </td>
              @for (header of tableHeaders(); track header.identifier.field) {
                <td>
                  @if (header.identifier.isBoolean) {
                    <p-tag [value]="entity[header.identifier.field] ? 'Yes' : 'No'"
                           [severity]="entity[header.identifier.field] ? 'success' : 'danger'">
                    </p-tag>
                  } @else {
                    {{ entity[header.identifier.field] }}
                  }
                </td>
              }
            </tr>
          </ng-template>
        </p-table>
      </div>

      <!-- Simple Paged Table -->
      <div class="mb-8">
        <h3 class="text-xl font-semibold mb-4">Simple Paged Table</h3>
        
        <p-table
          [value]="pagedTableHelper.data()"
          [lazy]="true"
          [loading]="pagedTableHelper.isLoading()"
          [totalRecords]="pagedTableHelper.totalRecords()"
          [paginator]="true"
          [rows]="10"
          (onLazyLoad)="pagedTableHelper.onLazyLoad($event)">
          
          <ng-template #header>
            <tr>
              <th>ID</th>
              <th>Description</th>
            </tr>
          </ng-template>
          
          <ng-template #body let-spec>
            <tr>
              <td>{{ spec.id }}</td>
              <td>{{ spec.description }}</td>
            </tr>
          </ng-template>
        </p-table>
      </div>

      <!-- Memoized Data Storage Examples -->
      <div class="mb-8">
        <h3 class="text-xl font-semibold mb-4">Memoized Data Storage</h3>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Single Data Example -->
          <div class="border p-4 rounded">
            <h4 class="font-semibold mb-2">Single Data (Machine Brand)</h4>
            <button pButton 
                    label="Load Machine Brands" 
                    (click)="getMachineBrands()"
                    [loading]="machineBrands.isLoading()"
                    class="mb-2">
            </button>
            @if (machineBrands.singleData(); as brand) {
              <p>Selected Brand: {{ brand.data }}</p>
            }
          </div>

          <!-- Multiple Data Example -->
          <div class="border p-4 rounded">
            <h4 class="font-semibold mb-2">Multiple Data (Machine Status)</h4>
            <button pButton 
                    label="Load Machine Status" 
                    (click)="getMachineStatus()"
                    [loading]="machineStatus.isLoading()"
                    class="mb-2">
            </button>
            <div class="max-h-40 overflow-y-auto">
              @for (status of machineStatus.multipleData(); track status.id) {
                <div class="p-2 border-b">{{ status.title }}</div>
              }
            </div>
          </div>
        </div>
      </div>

      <!-- NgSelect Helper Examples -->
      <div class="mb-8">
        <h3 class="text-xl font-semibold mb-4">NgSelect Helper Integration</h3>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Floor Selection -->
          <div>
            <label class="block text-sm font-semibold mb-2">Floor</label>
            <ng-select
              [items]="floorOptionsHelper.loadedData().payload"
              (scrollToEnd)="floorOptionsHelper.onScrollToEnd()"
              (open)="floorOptionsHelper.onOpen()"
              (clear)="floorOptionsHelper.onClear()"
              (blur)="floorOptionsHelper.onBlur()"
              (close)="floorOptionsHelper.onClose()"
              [typeahead]="floorOptionsHelper.inputSubject"
              [loading]="floorOptionsHelper.isLoading()"
              [virtualScroll]="true"
              bindLabel="data"
              placeholder="Select Floor">
            </ng-select>
          </div>

          <!-- Line Selection -->
          <div>
            <label class="block text-sm font-semibold mb-2">Line</label>
            <ng-select
              [items]="lineOptionsHelper.loadedData().payload"
              (scrollToEnd)="lineOptionsHelper.onScrollToEnd()"
              (open)="lineOptionsHelper.onOpen()"
              (clear)="lineOptionsHelper.onClear()"
              (blur)="lineOptionsHelper.onBlur()"
              (close)="lineOptionsHelper.onClose()"
              [typeahead]="lineOptionsHelper.inputSubject"
              [loading]="lineOptionsHelper.isLoading()"
              [minTermLength]="1"
              [virtualScroll]="true"
              bindLabel="data"
              placeholder="Select Line">
            </ng-select>
          </div>
        </div>
      </div>
    </div>
  `
})
export class MachineProfileExampleComponent implements OnInit {
  // Dependency injection
  private readonly httpClient = inject(HttpClient);
  private readonly formBuilder = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  // Input properties
  readonly selectedMachineSpec = input.required<MachineSpec>();

  // View references
  readonly dataTableRef = viewChild.required<Table>('dt');

  // Table State Helpers
  readonly dynamicTableHelper = PrimeNgDynamicTableStateHelper.create<MachineProfile>({
    url: '/api/machine-profiles/query',
    httpClient: this.httpClient
  });

  readonly pagedTableHelper = PrimengPagedDataTableStateHelper.create<MachineSpec>({
    url: '/api/machine-specs',
    httpClient: this.httpClient
  });

  // Component state management
  readonly componentData = new ComponentDataStorage<MachineProfile>();
  readonly componentState = new ComponentState().updateComponentTitle('Machine Profile');

  // Memoized data storage for dropdowns
  readonly machineBrands = new MemoizedDataStorage<KeyData<number, string>>(this.httpClient);
  readonly machineStatus = new MemoizedDataStorage<ReferenceDataDetail>(this.httpClient);

  // NgSelect helpers for complex dropdowns
  readonly floorOptionsHelper = new NgSelectHelper<KeyData<number, string>>(
    '/api/shared/floors',
    this.httpClient,
    this.destroyRef
  );

  readonly lineOptionsHelper = new NgSelectHelper<KeyData<number, string>>(
    '/api/shared/lines',
    this.httpClient,
    this.destroyRef,
    false, // requiresSearch
    50,    // pageSize
    false  // isLazyLoad
  );

  // Filter match modes for PrimeNG table
  readonly stringMatchModes = createPrimengStringMatchModes();
  readonly numberMatchModes = createPrimengNumberMatchModes();

  // Form for create/update operations
  readonly form = this.formBuilder.nonNullable.group({
    machineCode: ['', Validators.required],
    machineModel: ['', Validators.required],
    machineSerial: ['', Validators.required],
    machineDescription: this.formBuilder.control<string | null>(null),
    referenceBrandId: [0, Validators.required],
    refMachineStatusId: [0, Validators.required],
    isRented: [false]
  });

  // Table headers configuration using utility functions
  readonly tableHeaders = signal<PrimeNgTableHeader[]>([
    createTextColumn('machineCode', 'Machine Code', {
      filter: {
        placeholder: 'Search by Machine Code'
      }
    }),
    createTextColumn('machineModel', 'Machine Model', {
      filter: {
        placeholder: 'Search by Machine Model'
      }
    }),
    createTextColumn('machineSerial', 'Machine Serial', {
      filter: {
        placeholder: 'Search by Machine Serial'
      }
    }),
    createTextColumn('machineDescription', 'Description', {
      filter: {
        placeholder: 'Search by Description'
      }
    }),
    createTextColumn('referenceBrandName', 'Brand', {
      filter: {
        placeholder: 'Search by Brand'
      }
    }),
    createDateColumn('purchasedOnUtc', 'Purchased On', {
      filter: {
        placeholder: 'Filter by Purchase Date'
      }
    }),
    createBooleanColumn('isRented', 'Is Rented', {
      filter: {
        placeholder: 'Filter by Rental Status'
      }
    }),
    createTextColumn('refMachineStatusName', 'Status', {
      filter: {
        placeholder: 'Search by Status'
      }
    }),
    createTextColumn('createdByUserName', 'Created By', {
      filter: {
        placeholder: 'Search by Creator'
      }
    }),
    createDateColumn('createdAtUtc', 'Created At', {
      filter: {
        placeholder: 'Filter by Creation Date'
      }
    })
  ]).asReadonly();

  // Permission computed properties (example implementation)
  readonly hasReadPermission = computed(() => true); // Replace with actual auth logic
  readonly hasCreatePermission = computed(() => true);
  readonly hasUpdatePermission = computed(() => true);
  readonly hasCreateOrUpdatePermission = computed(() => 
    this.hasCreatePermission() || this.hasUpdatePermission()
  );

  ngOnInit() {
    // Set route parameter for the table
    this.dynamicTableHelper.setRouteParam(this.selectedMachineSpec().id.toString());
    
    // Initialize component state
    this.initializeComponent();
  }

  private initializeComponent() {
    // Set up reactive subscriptions
    this.selectedMachineSpec.pipe?.(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((spec) => {
      this.dynamicTableHelper.setRouteParam(spec.id.toString());
    });
  }

  // Memoized data loading methods
  async getMachineBrands() {
    await this.machineBrands.loadData('/api/machine-brands');
  }

  async getMachineStatus() {
    await this.machineStatus.loadMultipleData('/api/machine-status');
  }

  // Dialog management methods
  openCreateDialog() {
    this.componentState.isCreateOrUpdateDialogOpen.set(true);
    this.componentState.updateManipulationType('Create');
    this.form.reset();
  }

  async openUpdateDialog(entity: MachineProfile) {
    this.componentData.singleData.set(entity);
    this.componentState.isCreateOrUpdateDialogOpen.set(true);
    this.componentState.updateManipulationType('Update');
    
    // Populate form with entity data
    this.form.patchValue({
      machineCode: entity.machineCode,
      machineModel: entity.machineModel,
      machineSerial: entity.machineSerial,
      machineDescription: entity.machineDescription,
      referenceBrandId: entity.referenceBrandId,
      refMachineStatusId: entity.refMachineStatusId,
      isRented: entity.isRented
    });
  }

  // CRUD operations
  async createMachine() {
    if (!this.form.valid) return;

    try {
      const response = await this.httpClient.post('/api/machine-profiles', this.form.value).toPromise();
      console.log('Machine created:', response);
      await this.dynamicTableHelper.refresh();
      this.componentState.isCreateOrUpdateDialogOpen.set(false);
    } catch (error) {
      console.error('Error creating machine:', error);
    }
  }

  async updateMachine() {
    if (!this.form.valid) return;

    const selectedData = this.componentData.singleData();
    if (!selectedData) return;

    try {
      const response = await this.httpClient.put(
        `/api/machine-profiles/${selectedData.id}`, 
        this.form.value
      ).toPromise();
      console.log('Machine updated:', response);
      await this.dynamicTableHelper.refresh();
      this.componentState.isCreateOrUpdateDialogOpen.set(false);
    } catch (error) {
      console.error('Error updating machine:', error);
    }
  }

  async onCreateOrUpdate() {
    if (this.componentState.isOnUpdateState()) {
      await this.updateMachine();
    } else {
      await this.createMachine();
    }
  }
}
