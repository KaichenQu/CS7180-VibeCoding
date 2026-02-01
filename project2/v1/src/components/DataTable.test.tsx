import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DataTable from './DataTable';

describe('DataTable Component', () => {
  beforeEach(() => {
    render(<DataTable />);
  });

  describe('Initial Rendering', () => {
    it('should render the component with title', () => {
      expect(screen.getByText('Employee Directory')).toBeInTheDocument();
    });

    it('should render the search input', () => {
      expect(screen.getByPlaceholderText('Search all columns...')).toBeInTheDocument();
    });

    it('should display correct initial result count', () => {
      expect(screen.getByText('15 results')).toBeInTheDocument();
    });

    it('should render all column headers', () => {
      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByText('Department')).toBeInTheDocument();
      expect(screen.getByText('Role')).toBeInTheDocument();
      expect(screen.getByText('Salary')).toBeInTheDocument();
      expect(screen.getByText('Start Date')).toBeInTheDocument();
    });

    it('should display 5 rows per page by default', () => {
      const table = screen.getByRole('table');
      const rows = within(table).getAllByRole('row');
      // 1 header row + 5 data rows
      expect(rows).toHaveLength(6);
    });

    it('should display correct pagination info on page 1', () => {
      expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
    });
  });

  describe('Filtering Functionality', () => {
    it('should filter by name', async () => {
      const user = userEvent.setup();
      const searchInput = screen.getByPlaceholderText('Search all columns...');

      await user.type(searchInput, 'Alice');

      expect(screen.getByText('1 result')).toBeInTheDocument();
      expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
    });

    it('should filter by email', async () => {
      const user = userEvent.setup();
      const searchInput = screen.getByPlaceholderText('Search all columns...');

      await user.type(searchInput, 'bob@example.com');

      expect(screen.getByText('1 result')).toBeInTheDocument();
      expect(screen.getByText('Bob Smith')).toBeInTheDocument();
    });

    it('should filter by department', async () => {
      const user = userEvent.setup();
      const searchInput = screen.getByPlaceholderText('Search all columns...');

      await user.type(searchInput, 'Engineering');

      expect(screen.getByText('5 results')).toBeInTheDocument();
      expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
      expect(screen.getByText('Carol Williams')).toBeInTheDocument();
    });

    it('should filter by role', async () => {
      const user = userEvent.setup();
      const searchInput = screen.getByPlaceholderText('Search all columns...');

      await user.type(searchInput, 'Manager');

      expect(screen.getByText('3 results')).toBeInTheDocument();
    });

    it('should filter by salary', async () => {
      const user = userEvent.setup();
      const searchInput = screen.getByPlaceholderText('Search all columns...');

      await user.type(searchInput, '95000');

      expect(screen.getByText('1 result')).toBeInTheDocument();
      expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
    });

    it('should filter by start date', async () => {
      const user = userEvent.setup();
      const searchInput = screen.getByPlaceholderText('Search all columns...');

      await user.type(searchInput, '2020-03-15');

      expect(screen.getByText('1 result')).toBeInTheDocument();
      expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
    });

    it('should be case insensitive', async () => {
      const user = userEvent.setup();
      const searchInput = screen.getByPlaceholderText('Search all columns...');

      await user.type(searchInput, 'ALICE');

      expect(screen.getByText('1 result')).toBeInTheDocument();
      expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
    });

    it('should show "No results found" for non-matching search', async () => {
      const user = userEvent.setup();
      const searchInput = screen.getByPlaceholderText('Search all columns...');

      await user.type(searchInput, 'NonExistentName123');

      expect(screen.getByText('0 results')).toBeInTheDocument();
      expect(screen.getByText('No results found')).toBeInTheDocument();
    });

    it('should clear filter when clicking the X button', async () => {
      const user = userEvent.setup();
      const searchInput = screen.getByPlaceholderText('Search all columns...');

      await user.type(searchInput, 'Alice');
      expect(screen.getByText('1 result')).toBeInTheDocument();

      const clearButton = screen.getByRole('button', { name: '✕' });
      await user.click(clearButton);

      expect(screen.getByText('15 results')).toBeInTheDocument();
      expect(searchInput).toHaveValue('');
    });

    it('should reset to page 1 when filtering', async () => {
      const user = userEvent.setup();

      // Navigate to page 2
      const nextButton = screen.getByRole('button', { name: '›' });
      await user.click(nextButton);
      expect(screen.getByText('Page 2 of 3')).toBeInTheDocument();

      // Apply filter
      const searchInput = screen.getByPlaceholderText('Search all columns...');
      await user.type(searchInput, 'Engineering');

      // Should be back on page 1
      expect(screen.getByText('Page 1 of 1')).toBeInTheDocument();
    });
  });

  describe('Sorting Functionality', () => {
    it('should sort by name in ascending order', async () => {
      const user = userEvent.setup();
      const nameHeader = screen.getByText('Name').closest('th');

      await user.click(nameHeader!);

      const table = screen.getByRole('table');
      const rows = within(table).getAllByRole('row');
      const firstDataRow = rows[1];

      expect(within(firstDataRow).getByText('Alice Johnson')).toBeInTheDocument();
    });

    it('should sort by name in descending order on second click', async () => {
      const user = userEvent.setup();
      const nameHeader = screen.getByText('Name').closest('th');

      await user.click(nameHeader!);
      await user.click(nameHeader!);

      const table = screen.getByRole('table');
      const rows = within(table).getAllByRole('row');
      const firstDataRow = rows[1];

      expect(within(firstDataRow).getByText('Olivia Harris')).toBeInTheDocument();
    });

    it('should clear sort on third click', async () => {
      const user = userEvent.setup();
      const nameHeader = screen.getByText('Name').closest('th');

      await user.click(nameHeader!);
      await user.click(nameHeader!);
      await user.click(nameHeader!);

      // Check that sort indicator is back to default
      expect(within(nameHeader!).getByText('↕')).toBeInTheDocument();
    });

    it('should sort by salary (numeric) in ascending order', async () => {
      const user = userEvent.setup();
      const salaryHeader = screen.getByText('Salary').closest('th');

      await user.click(salaryHeader!);

      const table = screen.getByRole('table');
      const rows = within(table).getAllByRole('row');
      const firstDataRow = rows[1];

      // Lowest salary is Karen Davis with $55,000
      expect(within(firstDataRow).getByText('Karen Davis')).toBeInTheDocument();
      expect(within(firstDataRow).getByText('$55,000')).toBeInTheDocument();
    });

    it('should sort by salary (numeric) in descending order', async () => {
      const user = userEvent.setup();
      const salaryHeader = screen.getByText('Salary').closest('th');

      await user.click(salaryHeader!);
      await user.click(salaryHeader!);

      const table = screen.getByRole('table');
      const rows = within(table).getAllByRole('row');
      const firstDataRow = rows[1];

      // Highest salary is Carol Williams with $115,000
      expect(within(firstDataRow).getByText('Carol Williams')).toBeInTheDocument();
      expect(within(firstDataRow).getByText('$115,000')).toBeInTheDocument();
    });

    it('should sort by department alphabetically', async () => {
      const user = userEvent.setup();
      const departmentHeader = screen.getByText('Department').closest('th');

      await user.click(departmentHeader!);

      const table = screen.getByRole('table');
      const rows = within(table).getAllByRole('row');
      const firstDataRow = rows[1];

      // First alphabetically should be Design
      expect(within(firstDataRow).getByText('Design')).toBeInTheDocument();
    });

    it('should sort by start date', async () => {
      const user = userEvent.setup();
      const startDateHeader = screen.getByText('Start Date').closest('th');

      await user.click(startDateHeader!);

      const table = screen.getByRole('table');
      const rows = within(table).getAllByRole('row');
      const firstDataRow = rows[1];

      // Earliest date is 2016-03-30 (Mia Thompson)
      expect(within(firstDataRow).getByText('2016-03-30')).toBeInTheDocument();
    });

    it('should display correct sort indicator', async () => {
      const user = userEvent.setup();
      const nameHeader = screen.getByText('Name').closest('th');

      // Initial state - no sort
      expect(within(nameHeader!).getByText('↕')).toBeInTheDocument();

      // After first click - ascending
      await user.click(nameHeader!);
      expect(within(nameHeader!).getByText('↑')).toBeInTheDocument();

      // After second click - descending
      await user.click(nameHeader!);
      expect(within(nameHeader!).getByText('↓')).toBeInTheDocument();

      // After third click - back to no sort
      await user.click(nameHeader!);
      expect(within(nameHeader!).getByText('↕')).toBeInTheDocument();
    });

    it('should reset to page 1 when sorting', async () => {
      const user = userEvent.setup();

      // Navigate to page 2
      const nextButton = screen.getByRole('button', { name: '›' });
      await user.click(nextButton);
      expect(screen.getByText('Page 2 of 3')).toBeInTheDocument();

      // Sort by name
      const nameHeader = screen.getByText('Name').closest('th');
      await user.click(nameHeader!);

      // Should be back on page 1
      expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
    });

    it('should switch sort key when clicking different column', async () => {
      const user = userEvent.setup();
      const nameHeader = screen.getByText('Name').closest('th');
      const salaryHeader = screen.getByText('Salary').closest('th');

      // Sort by name ascending
      await user.click(nameHeader!);
      expect(within(nameHeader!).getByText('↑')).toBeInTheDocument();

      // Sort by salary - should start fresh at ascending
      await user.click(salaryHeader!);
      expect(within(salaryHeader!).getByText('↑')).toBeInTheDocument();
      expect(within(nameHeader!).getByText('↕')).toBeInTheDocument();
    });
  });

  describe('Pagination Functionality', () => {
    it('should display correct number of pages', () => {
      // 15 items / 5 per page = 3 pages
      expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
    });

    it('should navigate to next page', async () => {
      const user = userEvent.setup();
      const nextButton = screen.getByRole('button', { name: '›' });

      await user.click(nextButton);

      expect(screen.getByText('Page 2 of 3')).toBeInTheDocument();
    });

    it('should navigate to previous page', async () => {
      const user = userEvent.setup();
      const nextButton = screen.getByRole('button', { name: '›' });
      const prevButton = screen.getByRole('button', { name: '‹' });

      await user.click(nextButton);
      expect(screen.getByText('Page 2 of 3')).toBeInTheDocument();

      await user.click(prevButton);
      expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
    });

    it('should navigate to first page', async () => {
      const user = userEvent.setup();
      const nextButton = screen.getByRole('button', { name: '›' });
      const firstButton = screen.getByRole('button', { name: '«' });

      await user.click(nextButton);
      await user.click(nextButton);
      expect(screen.getByText('Page 3 of 3')).toBeInTheDocument();

      await user.click(firstButton);
      expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
    });

    it('should navigate to last page', async () => {
      const user = userEvent.setup();
      const lastButton = screen.getByRole('button', { name: '»' });

      await user.click(lastButton);
      expect(screen.getByText('Page 3 of 3')).toBeInTheDocument();
    });

    it('should disable previous and first buttons on first page', () => {
      const firstButton = screen.getByRole('button', { name: '«' });
      const prevButton = screen.getByRole('button', { name: '‹' });

      expect(firstButton).toBeDisabled();
      expect(prevButton).toBeDisabled();
    });

    it('should disable next and last buttons on last page', async () => {
      const user = userEvent.setup();
      const lastButton = screen.getByRole('button', { name: '»' });

      await user.click(lastButton);

      const nextButton = screen.getByRole('button', { name: '›' });
      expect(nextButton).toBeDisabled();
      expect(lastButton).toBeDisabled();
    });

    it('should change rows per page to 10', async () => {
      const user = userEvent.setup();
      const select = screen.getByRole('combobox');

      await user.selectOptions(select, '10');

      // 15 items / 10 per page = 2 pages
      expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();

      const table = screen.getByRole('table');
      const rows = within(table).getAllByRole('row');
      // 1 header row + 10 data rows
      expect(rows).toHaveLength(11);
    });

    it('should change rows per page to 15', async () => {
      const user = userEvent.setup();
      const select = screen.getByRole('combobox');

      await user.selectOptions(select, '15');

      // 15 items / 15 per page = 1 page
      expect(screen.getByText('Page 1 of 1')).toBeInTheDocument();

      const table = screen.getByRole('table');
      const rows = within(table).getAllByRole('row');
      // 1 header row + 15 data rows
      expect(rows).toHaveLength(16);
    });

    it('should reset to page 1 when changing rows per page', async () => {
      const user = userEvent.setup();
      const nextButton = screen.getByRole('button', { name: '›' });

      // Navigate to page 2
      await user.click(nextButton);
      expect(screen.getByText('Page 2 of 3')).toBeInTheDocument();

      // Change rows per page
      const select = screen.getByRole('combobox');
      await user.selectOptions(select, '10');

      // Should be back on page 1
      expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
    });

    it('should display correct data on page 2', async () => {
      const user = userEvent.setup();
      const nextButton = screen.getByRole('button', { name: '›' });

      await user.click(nextButton);

      // On page 2, we should see items 6-10
      expect(screen.getByText('Frank Garcia')).toBeInTheDocument();
      expect(screen.getByText('Grace Lee')).toBeInTheDocument();
      expect(screen.queryByText('Alice Johnson')).not.toBeInTheDocument();
    });

    it('should handle empty results pagination correctly', async () => {
      const user = userEvent.setup();
      const searchInput = screen.getByPlaceholderText('Search all columns...');

      await user.type(searchInput, 'NonExistent');

      expect(screen.getByText('Page 1 of 1')).toBeInTheDocument();
      const firstButton = screen.getByRole('button', { name: '«' });
      const prevButton = screen.getByRole('button', { name: '‹' });
      const nextButton = screen.getByRole('button', { name: '›' });
      const lastButton = screen.getByRole('button', { name: '»' });

      expect(firstButton).toBeDisabled();
      expect(prevButton).toBeDisabled();
      expect(nextButton).toBeDisabled();
      expect(lastButton).toBeDisabled();
    });
  });

  describe('Combined Functionality', () => {
    it('should filter and sort together', async () => {
      const user = userEvent.setup();
      const searchInput = screen.getByPlaceholderText('Search all columns...');

      // Filter by Engineering
      await user.type(searchInput, 'Engineering');
      expect(screen.getByText('5 results')).toBeInTheDocument();

      // Sort by salary ascending
      const salaryHeader = screen.getByText('Salary').closest('th');
      await user.click(salaryHeader!);

      // First should be Frank Garcia (lowest Engineering salary)
      const table = screen.getByRole('table');
      const rows = within(table).getAllByRole('row');
      const firstDataRow = rows[1];
      expect(within(firstDataRow).getByText('Frank Garcia')).toBeInTheDocument();
      expect(within(firstDataRow).getByText('$65,000')).toBeInTheDocument();
    });

    it('should filter, sort, and paginate together', async () => {
      const user = userEvent.setup();
      const searchInput = screen.getByPlaceholderText('Search all columns...');

      // Filter by Engineering (5 results)
      await user.type(searchInput, 'Engineering');
      expect(screen.getByText('5 results')).toBeInTheDocument();

      // Sort by name
      const nameHeader = screen.getByText('Name').closest('th');
      await user.click(nameHeader!);

      // Change rows per page to 2
      const select = screen.getByRole('combobox');
      await user.selectOptions(select, '5');

      // Should show all 5 on one page now
      expect(screen.getByText('Page 1 of 1')).toBeInTheDocument();
    });

    it('should maintain sort when filtering', async () => {
      const user = userEvent.setup();

      // Sort by salary descending
      const salaryHeader = screen.getByText('Salary').closest('th');
      await user.click(salaryHeader!);
      await user.click(salaryHeader!);

      // Verify sort indicator is still there
      expect(within(salaryHeader!).getByText('↓')).toBeInTheDocument();

      // Apply filter
      const searchInput = screen.getByPlaceholderText('Search all columns...');
      await user.type(searchInput, 'Engineering');

      // Sort should still be applied
      const table = screen.getByRole('table');
      const rows = within(table).getAllByRole('row');
      const firstDataRow = rows[1];

      // Highest Engineering salary is Carol Williams
      expect(within(firstDataRow).getByText('Carol Williams')).toBeInTheDocument();
      expect(within(firstDataRow).getByText('$115,000')).toBeInTheDocument();
    });
  });

  describe('Data Formatting', () => {
    it('should format salary with commas and dollar sign', () => {
      expect(screen.getByText('$95,000')).toBeInTheDocument();
      expect(screen.getByText('$115,000')).toBeInTheDocument();
    });

    it('should display department as a badge', () => {
      const badges = screen.getAllByText('Engineering');
      badges.forEach(badge => {
        expect(badge).toHaveClass('bg-blue-100', 'text-blue-800');
      });
    });

    it('should display dates in correct format', () => {
      expect(screen.getByText('2020-03-15')).toBeInTheDocument();
      expect(screen.getByText('2019-07-22')).toBeInTheDocument();
    });
  });
});
