import React from 'react';

// ════════════════════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ════════════════════════════════════════════════════════════════════════════════

/** Base constraint for row data - must have unique identifier */
export interface RowData {
  id: string | number;
}

/** Sort direction: null means unsorted */
export type SortDirection = 'asc' | 'desc' | null;

/** Sort state with column key and direction */
export interface SortState<T> {
  columnKey: keyof T | null;
  direction: SortDirection;
}

/** Column definition - generic over row type T */
export interface ColumnDefinition<T extends RowData> {
  /** Key in row data object */
  key: keyof T;
  /** Display header text */
  header: string;
  /** Optional custom cell renderer */
  render?: (value: T[keyof T], row: T, rowIndex: number) => React.ReactNode;
  /** Whether column is sortable (default: true) */
  sortable?: boolean;
  /** Optional width (CSS value) */
  width?: string;
  /** Alignment for cell content */
  align?: 'left' | 'center' | 'right';
}

/** Props for DataTable component */
export interface DataTableProps<T extends RowData> {
  /** Array of data rows */
  data: T[];
  /** Column definitions */
  columns: ColumnDefinition<T>[];
  /** Initial page size */
  initialPageSize?: number;
  /** Available page size options */
  pageSizeOptions?: number[];
  /** Optional caption for accessibility */
  caption?: string;
  /** Optional CSS class for container */
  className?: string;
}

/** Internal row wrapper for stable sorting */
export interface IndexedRow<T> {
  row: T;
  originalIndex: number;
}
