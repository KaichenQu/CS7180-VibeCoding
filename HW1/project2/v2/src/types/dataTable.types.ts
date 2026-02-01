import { ReactNode } from 'react';

// ============================================
// TYPE DEFINITIONS
// ============================================

/** Generic row data model - must have an id */
export interface BaseRow {
  id: string | number;
}

/** Sort direction state */
export type SortDirection = 'asc' | 'desc' | null;

/** Sort state tracking current column and direction */
export interface SortState<T extends BaseRow> {
  key: keyof T | null;
  direction: SortDirection;
}

/** Pagination state */
export interface PaginationState {
  currentPage: number;
  pageSize: number;
}

/** Column definition with optional render and sortable config */
export interface ColumnDef<T extends BaseRow> {
  key: keyof T;
  header: string;
  render?: (value: T[keyof T], row: T) => ReactNode;
  sortable?: boolean; // defaults to true if not specified
  width?: string;
}

/** Props for the DataTable component */
export interface DataTableProps<T extends BaseRow> {
  data: T[];
  columns: ColumnDef<T>[];
  initialPageSize?: number;
  pageSizeOptions?: number[];
}
