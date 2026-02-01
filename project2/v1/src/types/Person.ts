export interface Person {
  id: number;
  name: string;
  email: string;
  department: string;
  role: string;
  salary: number;
  startDate: string;
}

export type SortDirection = 'asc' | 'desc' | null;
export type SortKey = keyof Person | null;
