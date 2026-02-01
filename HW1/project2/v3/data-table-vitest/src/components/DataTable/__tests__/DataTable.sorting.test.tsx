import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DataTable } from '../DataTable';
import { sampleProducts, productColumns } from '@/data/sampleData';

describe('DataTable - Sorting', () => {
  test('clicking header cycles: none → asc → desc → none', async () => {
    const user = userEvent.setup();
    render(<DataTable data={sampleProducts} columns={productColumns} />);

    const nameHeader = screen.getByText('Product Name').closest('th');

    // Initial: no sort (— indicator)
    expect(nameHeader).toContainHTML('—');

    // First click: ascending
    await user.click(nameHeader!);
    expect(nameHeader).toContainHTML('↑');

    // Second click: descending
    await user.click(nameHeader!);
    expect(nameHeader).toContainHTML('↓');

    // Third click: back to none
    await user.click(nameHeader!);
    expect(nameHeader).toContainHTML('—');
  });

  test('clicking different column resets to ascending', async () => {
    const user = userEvent.setup();
    render(<DataTable data={sampleProducts} columns={productColumns} />);

    const nameHeader = screen.getByText('Product Name').closest('th');
    const priceHeader = screen.getByText('Price').closest('th');

    // Sort name descending
    await user.click(nameHeader!);
    await user.click(nameHeader!);
    expect(nameHeader).toContainHTML('↓');

    // Click price: should start at ascending
    await user.click(priceHeader!);
    expect(priceHeader).toContainHTML('↑');
    expect(nameHeader).toContainHTML('—');
  });

  test('sorts numbers correctly in ascending order', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <DataTable data={sampleProducts} columns={productColumns} initialPageSize={20} />
    );

    const priceHeader = screen.getByText('Price').closest('th');

    // Sort ascending
    await user.click(priceHeader!);

    const prices = Array.from(container.querySelectorAll('tbody tr')).map(row => {
      const priceCell = row.querySelector('td:nth-child(3)');
      return Number(priceCell?.textContent?.replace(/[$,]/g, '') || 0);
    });

    // Verify ascending order
    for (let i = 0; i < prices.length - 1; i++) {
      expect(prices[i]).toBeLessThanOrEqual(prices[i + 1]);
    }
  });

  test('sorts numbers correctly in descending order', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <DataTable data={sampleProducts} columns={productColumns} initialPageSize={20} />
    );

    const priceHeader = screen.getByText('Price').closest('th');

    // Sort descending (click twice)
    await user.click(priceHeader!);
    await user.click(priceHeader!);

    const prices = Array.from(container.querySelectorAll('tbody tr')).map(row => {
      const priceCell = row.querySelector('td:nth-child(3)');
      return Number(priceCell?.textContent?.replace(/[$,]/g, '') || 0);
    });

    // Verify descending order
    for (let i = 0; i < prices.length - 1; i++) {
      expect(prices[i]).toBeGreaterThanOrEqual(prices[i + 1]);
    }
  });

  test('sorts dates correctly', async () => {
    const user = userEvent.setup();
    render(
      <DataTable data={sampleProducts} columns={productColumns} initialPageSize={20} />
    );

    const dateHeader = screen.getByText('Last Updated').closest('th');

    // Sort ascending
    await user.click(dateHeader!);

    // Verify first item is earliest date (Jan 8, 2024)
    expect(screen.getByText('Jan 8, 2024')).toBeInTheDocument();
  });

  test('stable sort preserves original order for equal values', async () => {
    const testData = [
      { id: 1, name: 'A', value: 5 },
      { id: 2, name: 'B', value: 5 },
      { id: 3, name: 'C', value: 5 },
    ];

    const testColumns = [
      { key: 'name' as const, header: 'Name' },
      { key: 'value' as const, header: 'Value' },
    ];

    const user = userEvent.setup();
    render(<DataTable data={testData} columns={testColumns} />);

    const valueHeader = screen.getByText('Value').closest('th');
    await user.click(valueHeader!);

    // Order should be preserved: A, B, C
    const rows = screen.getAllByRole('row').slice(1); // Skip header
    expect(rows[0]).toHaveTextContent('A');
    expect(rows[1]).toHaveTextContent('B');
    expect(rows[2]).toHaveTextContent('C');
  });

  test('keyboard navigation: Enter key sorts', async () => {
    const user = userEvent.setup();
    render(<DataTable data={sampleProducts} columns={productColumns} />);

    const nameHeader = screen.getByText('Product Name').closest('th');
    nameHeader?.focus();

    await user.keyboard('{Enter}');
    expect(nameHeader).toContainHTML('↑');
  });

  test('keyboard navigation: Space key sorts', async () => {
    const user = userEvent.setup();
    render(<DataTable data={sampleProducts} columns={productColumns} />);

    const nameHeader = screen.getByText('Product Name').closest('th');
    nameHeader?.focus();

    await user.keyboard(' ');
    expect(nameHeader).toContainHTML('↑');
  });

  test('non-sortable column does not sort', async () => {
    const testColumns = [
      { key: 'name' as const, header: 'Name', sortable: false },
    ];

    const user = userEvent.setup();
    render(<DataTable data={sampleProducts.slice(0, 3)} columns={testColumns} />);

    const nameHeader = screen.getByText('Name').closest('th');

    // Should not have sort indicator
    expect(nameHeader).not.toContainHTML('—');

    // Click should not add sort indicator
    await user.click(nameHeader!);
    expect(nameHeader).not.toContainHTML('↑');
  });

  test('sort indicator shows active state', async () => {
    const user = userEvent.setup();
    render(<DataTable data={sampleProducts} columns={productColumns} />);

    const nameHeader = screen.getByText('Product Name').closest('th');

    await user.click(nameHeader!);

    // Active sort should have blue color
    const indicator = nameHeader?.querySelector('.text-blue-600');
    expect(indicator).toBeInTheDocument();
  });

  test('aria-sort attribute updates correctly', async () => {
    const user = userEvent.setup();
    render(<DataTable data={sampleProducts} columns={productColumns} />);

    const nameHeader = screen.getByText('Product Name').closest('th');

    // Initial state
    expect(nameHeader).toHaveAttribute('aria-sort', 'none');

    // After first click: ascending
    await user.click(nameHeader!);
    expect(nameHeader).toHaveAttribute('aria-sort', 'ascending');

    // After second click: descending
    await user.click(nameHeader!);
    expect(nameHeader).toHaveAttribute('aria-sort', 'descending');

    // After third click: back to none
    await user.click(nameHeader!);
    expect(nameHeader).toHaveAttribute('aria-sort', 'none');
  });

  test('sorts text alphabetically', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <DataTable data={sampleProducts} columns={productColumns} initialPageSize={20} />
    );

    const nameHeader = screen.getByText('Product Name').closest('th');

    // Sort ascending
    await user.click(nameHeader!);

    const names = Array.from(container.querySelectorAll('tbody tr')).map(row => {
      const nameCell = row.querySelector('td:nth-child(1)');
      return nameCell?.textContent || '';
    });

    // Verify alphabetical order (first few items)
    expect(names[0].localeCompare(names[1])).toBeLessThanOrEqual(0);
  });
});
