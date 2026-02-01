import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DataTable } from '../DataTable';
import type { Product } from '@/data/sampleData';
import { sampleProducts, productColumns } from '@/data/sampleData';
import { withSplitText } from './test-utils';

describe('DataTable', () => {
  describe('Rendering', () => {
    test('renders without crashing', () => {
      render(<DataTable data={sampleProducts} columns={productColumns} />);
    });

    test('renders column headers', () => {
      render(<DataTable data={sampleProducts} columns={productColumns} />);
      expect(screen.getByText('Product Name')).toBeInTheDocument();
      expect(screen.getByText('Category')).toBeInTheDocument();
      expect(screen.getByText('Price')).toBeInTheDocument();
      expect(screen.getByText('Stock')).toBeInTheDocument();
      expect(screen.getByText('Rating')).toBeInTheDocument();
      expect(screen.getByText('Last Updated')).toBeInTheDocument();
    });

    test('renders data rows', () => {
      render(<DataTable data={sampleProducts} columns={productColumns} initialPageSize={5} />);
      expect(screen.getByText('MacBook Pro 16"')).toBeInTheDocument();
    });

    test('renders empty state when no data', () => {
      render(<DataTable data={[]} columns={productColumns} />);
      expect(screen.getByText('No data available')).toBeInTheDocument();
    });

    test('renders custom caption', () => {
      const { container } = render(
        <DataTable
          data={sampleProducts}
          columns={productColumns}
          caption="Test table caption"
        />
      );
      const caption = container.querySelector('caption');
      expect(caption).toHaveTextContent('Test table caption');
    });

    test('applies custom className', () => {
      const { container } = render(
        <DataTable
          data={sampleProducts}
          columns={productColumns}
          className="custom-class"
        />
      );
      expect(container.firstChild).toHaveClass('custom-class');
    });

    test('renders filter input', () => {
      render(<DataTable data={sampleProducts} columns={productColumns} />);
      const filterInput = screen.getByPlaceholderText(/filter all columns/i);
      expect(filterInput).toBeInTheDocument();
    });

    test('renders pagination controls', () => {
      render(<DataTable data={sampleProducts} columns={productColumns} />);
      expect(screen.getByLabelText(/rows per page/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/go to first page/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/go to previous page/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/go to next page/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/go to last page/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('table has role="grid"', () => {
      const { container } = render(<DataTable data={sampleProducts} columns={productColumns} />);
      const table = container.querySelector('table');
      expect(table).toHaveAttribute('role', 'grid');
    });

    test('has live region for announcements', () => {
      const { container } = render(<DataTable data={sampleProducts} columns={productColumns} />);
      const liveRegion = container.querySelector('[role="status"][aria-live="polite"]');
      expect(liveRegion).toBeInTheDocument();
    });

    test('sortable headers have tabIndex', () => {
      render(<DataTable data={sampleProducts} columns={productColumns} />);
      const header = screen.getByText('Product Name').closest('th');
      expect(header).toHaveAttribute('tabIndex', '0');
    });

    test('filter input has label', () => {
      render(<DataTable data={sampleProducts} columns={productColumns} />);
      const filterInput = screen.getByLabelText(/filter table/i);
      expect(filterInput).toBeInTheDocument();
    });

    test('pagination nav has aria-label', () => {
      const { container } = render(<DataTable data={sampleProducts} columns={productColumns} />);
      const nav = container.querySelector('nav[aria-label="Table pagination"]');
      expect(nav).toBeInTheDocument();
    });

    test('all buttons have aria-labels', () => {
      render(<DataTable data={sampleProducts} columns={productColumns} />);
      expect(screen.getByLabelText(/go to first page/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/go to previous page/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/go to next page/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/go to last page/i)).toBeInTheDocument();
    });
  });

  describe('Custom renderers', () => {
    test('uses custom render function when provided', () => {
      const customColumns = [
        {
          key: 'name' as keyof Product,
          header: 'Name',
          render: () => <span data-testid="custom-render">Custom</span>
        }
      ];
      render(<DataTable data={sampleProducts.slice(0, 1)} columns={customColumns} />);
      expect(screen.getByTestId('custom-render')).toBeInTheDocument();
    });

    test('renders null/undefined values with placeholder', () => {
      const testData = [
        { id: 1, name: null, value: undefined },
      ];
      const testColumns = [
        { key: 'name' as const, header: 'Name' },
        { key: 'value' as const, header: 'Value' },
      ];
      const { container } = render(<DataTable data={testData} columns={testColumns} />);
      const placeholders = container.querySelectorAll('.text-gray-400');
      expect(placeholders.length).toBeGreaterThan(0);
    });
  });

  describe('Column alignment', () => {
    test('applies left alignment', () => {
      const columns = [
        { key: 'name' as keyof Product, header: 'Name', align: 'left' as const },
      ];
      const { container } = render(<DataTable data={sampleProducts.slice(0, 1)} columns={columns} />);
      const cell = container.querySelector('td');
      expect(cell).toHaveClass('text-left');
    });

    test('applies center alignment', () => {
      const columns = [
        { key: 'name' as keyof Product, header: 'Name', align: 'center' as const },
      ];
      const { container } = render(<DataTable data={sampleProducts.slice(0, 1)} columns={columns} />);
      const cell = container.querySelector('td');
      expect(cell).toHaveClass('text-center');
    });

    test('applies right alignment', () => {
      const columns = [
        { key: 'name' as keyof Product, header: 'Name', align: 'right' as const },
      ];
      const { container } = render(<DataTable data={sampleProducts.slice(0, 1)} columns={columns} />);
      const cell = container.querySelector('td');
      expect(cell).toHaveClass('text-right');
    });
  });

  describe('Results summary', () => {
    test('shows correct count for first page', () => {
      render(<DataTable data={sampleProducts} columns={productColumns} initialPageSize={5} />);
      expect(screen.getByText(withSplitText(/showing 1–5 of 20/i))).toBeInTheDocument();
    });

    test('shows "No results" when data is empty', () => {
      render(<DataTable data={[]} columns={productColumns} />);
      expect(screen.getByText('No results')).toBeInTheDocument();
    });

    test('shows filtered count when filter is applied', async () => {
      const user = userEvent.setup();
      render(<DataTable data={sampleProducts} columns={productColumns} />);
      const filterInput = screen.getByLabelText(/filter table/i);
      await user.type(filterInput, 'Mac');
      // After filtering, the component should show filtered count
      expect(screen.getByText(/filtered from 20/i, { exact: false })).toBeInTheDocument();
    });
  });
});
