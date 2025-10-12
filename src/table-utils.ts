import { SelectItem } from "primeng/api";
import {
  StringFilterType,
  NumericFilterType,
  PrimeNgTableHeader,
  NestableColumn,
} from "./types";

/**
 * Creates PrimeNG SelectItem array for numeric filter match modes
 * @param styleClass - CSS class for styling the options
 * @param disabled - Whether the options should be disabled
 * @returns Array of SelectItem for numeric filters
 */
export function createPrimengNumberMatchModes(
  styleClass: string = "p-text-capitalize",
  disabled: boolean = false
): SelectItem<NumericFilterType>[] {
  return [
    {
      label: "Equals",
      value: "equals",
      title: "Equals",
      styleClass: styleClass,
      disabled: disabled,
    },
    {
      label: "Not Equals",
      value: "notEquals",
      title: "Not Equals",
      styleClass: styleClass,
      disabled: disabled,
    },
    {
      label: "Greater Than",
      value: "greaterThan",
      title: "Greater Than",
      styleClass: styleClass,
      disabled: disabled,
    },
    {
      label: "Greater Than Or Equals",
      value: "greaterThanOrEqual",
      title: "Greater Than Or Equals",
      styleClass: styleClass,
      disabled: disabled,
    },
    {
      label: "Less Than",
      value: "lessThan",
      title: "Less Than",
      styleClass: styleClass,
      disabled: disabled,
    },
    {
      label: "Less Than Or Equals",
      value: "lessThanOrEqual",
      title: "Less Than Or Equals",
      styleClass: styleClass,
      disabled: disabled,
    },
  ];
}

/**
 * Creates PrimeNG SelectItem array for string filter match modes
 * @param styleClass - CSS class for styling the options
 * @param disabled - Whether the options should be disabled
 * @returns Array of SelectItem for string filters
 */
export function createPrimengStringMatchModes(
  styleClass: string = "p-text-capitalize",
  disabled: boolean = false
): SelectItem<StringFilterType>[] {
  return [
    {
      label: "Contains",
      value: "contains",
      title: "Contains",
      styleClass: styleClass,
      disabled: disabled,
    },
    {
      label: "Not Contains",
      value: "notContains",
      title: "Not Contains",
      styleClass: styleClass,
      disabled: disabled,
    },
    {
      label: "Starts With",
      value: "startsWith",
      title: "Starts With",
      styleClass: styleClass,
      disabled: disabled,
    },
    {
      label: "Not Starts With",
      value: "notStartsWith",
      title: "Not Starts With",
      styleClass: styleClass,
      disabled: disabled,
    },
    {
      label: "Ends With",
      value: "endsWith",
      title: "Ends With",
      styleClass: styleClass,
      disabled: disabled,
    },
    {
      label: "Not Ends With",
      value: "notEndsWith",
      title: "Not Ends With",
      styleClass: styleClass,
      disabled: disabled,
    },
  ];
}

/**
 * Creates a complete table header configuration for text columns
 * @param field - The field name for the column
 * @param label - Display label for the column header
 * @param options - Additional configuration options
 * @returns Complete PrimeNgTableHeader configuration
 */
export function createTextColumn(
  field: string,
  label: string,
  options: {
    hasSort?: boolean;
    hasFilter?: boolean;
    placeholder?: string;
    matchModeOptions?: SelectItem<StringFilterType>[];
    defaultMatchMode?: StringFilterType;
    styleClass?: string;
    filterStyleClass?: Record<string, string>;
  } & NestableColumn = {}
): PrimeNgTableHeader {
  const header: PrimeNgTableHeader = {
    identifier: {
      label,
      field,
      isNested: options.isNested,
      hasSort: options.hasSort ?? false,
      styleClass: options.styleClass,
    },
  };

  if (options.hasFilter ?? false) {
    header.filter = {
      type: "text",
      placeholder: options.placeholder ?? `Search by ${label.toLowerCase()}`,
      matchModeOptions:
        options.matchModeOptions ?? createPrimengStringMatchModes(),
      defaultMatchMode: options.defaultMatchMode ?? "contains",
      ariaLabel: `Filter by ${label}`,
      styleClass: options.filterStyleClass,
    };
  }

  return header;
}

/**
 * Creates a complete table header configuration for numeric columns
 * @param field - The field name for the column
 * @param label - Display label for the column header
 * @param options - Additional configuration options
 * @returns Complete PrimeNgTableHeader configuration
 */
export function createNumericColumn(
  field: string,
  label: string,
  options: {
    hasSort?: boolean;
    hasFilter?: boolean;
    placeholder?: string;
    matchModeOptions?: SelectItem<NumericFilterType>[];
    defaultMatchMode?: NumericFilterType;
    styleClass?: string;
    filterStyleClass?: Record<string, string>;
  } & NestableColumn = {}
): PrimeNgTableHeader {
  const header: PrimeNgTableHeader = {
    identifier: {
      label,
      field,
      isNested: options.isNested,
      hasSort: options.hasSort ?? false,
      styleClass: options.styleClass,
    },
  };

  if (options.hasFilter ?? false) {
    header.filter = {
      type: "numeric",
      placeholder: options.placeholder ?? `Filter by ${label.toLowerCase()}`,
      matchModeOptions:
        options.matchModeOptions ?? createPrimengNumberMatchModes(),
      defaultMatchMode: options.defaultMatchMode ?? "equals",
      ariaLabel: `Filter by ${label}`,
      styleClass: options.filterStyleClass,
    };
  }

  return header;
}

/**
 * Creates a complete table header configuration for boolean columns
 * @param field - The field name for the column
 * @param label - Display label for the column header
 * @param options - Additional configuration options
 * @returns Complete PrimeNgTableHeader configuration
 */
export function createBooleanColumn(
  field: string,
  label: string,
  options: {
    hasSort?: boolean;
    hasFilter?: boolean;
    styleClass?: string;
    filterStyleClass?: Record<string, string>;
  } & NestableColumn = {}
): PrimeNgTableHeader {
  const header: PrimeNgTableHeader = {
    identifier: {
      label,
      field,
      isNested: options.isNested,
      hasSort: options.hasSort ?? false,
      isBoolean: true,
      styleClass: options.styleClass,
    },
  };

  if (options.hasFilter ?? false) {
    header.filter = {
      type: "boolean",
      defaultMatchMode: "equals",
      ariaLabel: `Filter by ${label}`,
      styleClass: options.filterStyleClass,
    };
  }

  return header;
}

/**
 * Creates a complete table header configuration for date columns (date only)
 * @param field - The field name for the column
 * @param label - Display label for the column header
 * @param options - Additional configuration options
 * @returns Complete PrimeNgTableHeader configuration
 */
export function createDateColumn(
  field: string,
  label: string,
  options: {
    hasSort?: boolean;
    hasFilter?: boolean;
    placeholder?: string;
    styleClass?: string;
    filterStyleClass?: Record<string, string>;
  } & NestableColumn = {}
): PrimeNgTableHeader {
  const header: PrimeNgTableHeader = {
    identifier: {
      label,
      field,
      isNested: options.isNested,
      hasSort: options.hasSort ?? false,
      isDate: true,
      styleClass: options.styleClass,
    },
  };

  if (options.hasFilter ?? false) {
    header.filter = {
      type: "date",
      placeholder: options.placeholder ?? `Select ${label.toLowerCase()}`,
      defaultMatchMode: "equals",
      ariaLabel: `Filter by ${label}`,
      styleClass: options.filterStyleClass,
    };
  }

  return header;
}

/**
 * Creates a complete table header configuration for datetime columns (date and time)
 * @param field - The field name for the column
 * @param label - Display label for the column header
 * @param options - Additional configuration options
 * @returns Complete PrimeNgTableHeader configuration
 */
export function createDateTimeColumn(
  field: string,
  label: string,
  options: {
    hasSort?: boolean;
    hasFilter?: boolean;
    placeholder?: string;
    styleClass?: string;
    filterStyleClass?: Record<string, string>;
  } & NestableColumn = {}
): PrimeNgTableHeader {
  const header: PrimeNgTableHeader = {
    identifier: {
      label,
      field,
      isNested: options.isNested,
      hasSort: options.hasSort ?? false,
      isDateTime: true,
      styleClass: options.styleClass,
    },
  };

  if (options.hasFilter ?? false) {
    header.filter = {
      type: "date",
      placeholder: options.placeholder ?? `Select ${label.toLowerCase()}`,
      defaultMatchMode: "equals",
      ariaLabel: `Filter by ${label}`,
      styleClass: options.filterStyleClass,
    };
  }

  return header;
}

/**
 * Creates a complete table header configuration for time-only columns
 * @param field - The field name for the column
 * @param label - Display label for the column header
 * @param options - Additional configuration options
 * @returns Complete PrimeNgTableHeader configuration
 */
export function createTimeColumn(
  field: string,
  label: string,
  options: {
    hasSort?: boolean;
    hasFilter?: boolean;
    placeholder?: string;
    styleClass?: string;
    filterStyleClass?: Record<string, string>;
  } & NestableColumn = {}
): PrimeNgTableHeader {
  const header: PrimeNgTableHeader = {
    identifier: {
      label,
      field,
      isNested: options.isNested,
      hasSort: options.hasSort ?? false,
      isTimeOnly: true,
      styleClass: options.styleClass,
    },
  };

  if (options.hasFilter ?? false) {
    header.filter = {
      type: "text",
      placeholder: options.placeholder ?? `Filter by ${label.toLowerCase()}`,
      defaultMatchMode: "contains",
      ariaLabel: `Filter by ${label}`,
      styleClass: options.filterStyleClass,
    };
  }

  return header;
}

/**
 * Creates a complete table header configuration for dropdown columns
 * @param field - The field name for the column
 * @param label - Display label for the column header
 * @param dropdownOptions - Options for the dropdown filter
 * @param options - Additional configuration options
 * @returns Complete PrimeNgTableHeader configuration
 */
export function createDropdownColumn(
  field: string,
  label: string,
  dropdownOptions: SelectItem[],
  options: {
    hasSort?: boolean;
    hasFilter?: boolean;
    placeholder?: string;
    styleClass?: string;
    filterStyleClass?: Record<string, string>;
  } = {}
): PrimeNgTableHeader {
  const header: PrimeNgTableHeader = {
    identifier: {
      label,
      field,
      hasSort: options.hasSort ?? false,
      styleClass: options.styleClass,
    },
  };

  if (options.hasFilter ?? false) {
    header.filter = {
      type: "dropdown",
      placeholder: options.placeholder ?? `Select ${label.toLowerCase()}`,
      matchModeOptions: dropdownOptions,
      defaultMatchMode: "equals",
      ariaLabel: `Filter by ${label}`,
      styleClass: options.filterStyleClass,
    };
  }

  return header;
}

/**
 * Creates a complete table header configuration for multiselect columns
 * @param field - The field name for the column
 * @param label - Display label for the column header
 * @param multiselectOptions - Options for the multiselect filter
 * @param options - Additional configuration options
 * @returns Complete PrimeNgTableHeader configuration
 */
export function createMultiselectColumn(
  field: string,
  label: string,
  multiselectOptions: SelectItem[],
  options: {
    hasSort?: boolean;
    hasFilter?: boolean;
    placeholder?: string;
    styleClass?: string;
    filterStyleClass?: Record<string, string>;
  } = {}
): PrimeNgTableHeader {
  const header: PrimeNgTableHeader = {
    identifier: {
      label,
      field,
      hasSort: options.hasSort ?? false,
      styleClass: options.styleClass,
    },
  };

  if (options.hasFilter ?? false) {
    header.filter = {
      type: "multiselect",
      placeholder: options.placeholder ?? `Select ${label.toLowerCase()}`,
      matchModeOptions: multiselectOptions,
      defaultMatchMode: "equals",
      ariaLabel: `Filter by ${label}`,
      styleClass: options.filterStyleClass,
    };
  }

  return header;
}

/**
 * Creates a simple table header configuration without filtering
 * @param field - The field name for the column
 * @param label - Display label for the column header
 * @param options - Additional configuration options
 * @returns Simple PrimeNgTableHeader configuration
 */
export function createSimpleColumn(
  field: string,
  label: string,
  options: {
    hasSort?: boolean;
    styleClass?: string;
  } & NestableColumn = {}
): PrimeNgTableHeader {
  return {
    identifier: {
      label,
      field,
      isNested: options.isNested,
      hasSort: options.hasSort ?? false,
      styleClass: options.styleClass,
    },
  };
}

/**
 * Utility function to merge multiple table header configurations
 * @param headers - Array of table header configurations
 * @returns Array of merged headers
 */
export function mergeTableHeaders(
  ...headers: PrimeNgTableHeader[]
): PrimeNgTableHeader[] {
  return headers;
}

/**
 * Utility function to create boolean SelectItem options
 * @param trueLabel - Label for true value
 * @param falseLabel - Label for false value
 * @returns Array of SelectItem for boolean values
 */
export function createBooleanSelectItems(
  trueLabel: string = "Yes",
  falseLabel: string = "No"
): SelectItem[] {
  return [
    { label: trueLabel, value: true },
    { label: falseLabel, value: false },
  ];
}

/**
 * Utility function to create status SelectItem options
 * @param statusOptions - Object mapping status values to labels
 * @returns Array of SelectItem for status values
 */
export function createStatusSelectItems(
  statusOptions: Record<string | number, string>
): SelectItem[] {
  return Object.entries(statusOptions).map(([value, label]) => ({
    label,
    value: isNaN(Number(value)) ? value : Number(value),
  }));
}
