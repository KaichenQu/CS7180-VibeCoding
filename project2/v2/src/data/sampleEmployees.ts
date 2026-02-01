import { BaseRow } from '../types/dataTable.types';

/** Employee data model */
export interface Employee extends BaseRow {
  id: number;
  name: string;
  email: string;
  department: string;
  role: string;
  salary: number;
  startDate: string;
  isActive: boolean;
}

/** Sample employee data */
export const sampleEmployees: Employee[] = [
  { id: 1, name: 'Alice Johnson', email: 'alice@acme.com', department: 'Engineering', role: 'Senior Developer', salary: 95000, startDate: '2020-03-15', isActive: true },
  { id: 2, name: 'Bob Smith', email: 'bob@acme.com', department: 'Marketing', role: 'Marketing Manager', salary: 78000, startDate: '2019-07-22', isActive: true },
  { id: 3, name: 'Carol Williams', email: 'carol@acme.com', department: 'Engineering', role: 'Tech Lead', salary: 115000, startDate: '2018-01-10', isActive: true },
  { id: 4, name: 'David Brown', email: 'david@acme.com', department: 'Sales', role: 'Sales Rep', salary: 62000, startDate: '2021-05-03', isActive: false },
  { id: 5, name: 'Eva Martinez', email: 'eva@acme.com', department: 'HR', role: 'HR Specialist', salary: 58000, startDate: '2020-11-18', isActive: true },
  { id: 6, name: 'Frank Garcia', email: 'frank@acme.com', department: 'Engineering', role: 'Junior Developer', salary: 65000, startDate: '2022-02-28', isActive: true },
  { id: 7, name: 'Grace Lee', email: 'grace@acme.com', department: 'Finance', role: 'Financial Analyst', salary: 72000, startDate: '2019-09-14', isActive: true },
  { id: 8, name: 'Henry Wilson', email: 'henry@acme.com', department: 'Engineering', role: 'DevOps Engineer', salary: 98000, startDate: '2020-06-01', isActive: true },
  { id: 9, name: 'Ivy Chen', email: 'ivy@acme.com', department: 'Design', role: 'UX Designer', salary: 82000, startDate: '2021-01-25', isActive: true },
  { id: 10, name: 'Jack Taylor', email: 'jack@acme.com', department: 'Sales', role: 'Sales Manager', salary: 88000, startDate: '2017-12-05', isActive: true },
  { id: 11, name: 'Karen Davis', email: 'karen@acme.com', department: 'Marketing', role: 'Content Writer', salary: 55000, startDate: '2022-04-11', isActive: false },
  { id: 12, name: 'Leo Anderson', email: 'leo@acme.com', department: 'Engineering', role: 'QA Engineer', salary: 70000, startDate: '2020-08-20', isActive: true },
  { id: 13, name: 'Mia Thompson', email: 'mia@acme.com', department: 'HR', role: 'HR Manager', salary: 85000, startDate: '2016-03-30', isActive: true },
  { id: 14, name: 'Nathan White', email: 'nathan@acme.com', department: 'Finance', role: 'Accountant', salary: 68000, startDate: '2021-07-07', isActive: true },
  { id: 15, name: 'Olivia Harris', email: 'olivia@acme.com', department: 'Design', role: 'Graphic Designer', salary: 60000, startDate: '2022-01-15', isActive: true },
  { id: 16, name: 'Peter Clark', email: 'peter@acme.com', department: 'Engineering', role: 'Architect', salary: 130000, startDate: '2015-08-01', isActive: true },
  { id: 17, name: 'Quinn Roberts', email: 'quinn@acme.com', department: 'Sales', role: 'Account Executive', salary: 75000, startDate: '2023-01-09', isActive: true },
];
