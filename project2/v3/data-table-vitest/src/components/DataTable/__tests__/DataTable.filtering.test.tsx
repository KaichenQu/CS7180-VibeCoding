import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DataTable } from '../DataTable';
import { sampleProducts, productColumns } from '@/data/sampleData';
import { withSplitText } from './test-utils';

describe('DataTable - Filtering', () => {
  test('filters data based on search term', async () => {
    const user = userEvent.setup();
    render(<DataTable data={sampleProducts} columns={productColumns} />);

    const filterInput = screen.getByLabelText(/filter table/i);

    await user.type(filterInput, 'MacBook');

    expect(screen.getByText('MacBook Pro 16"')).toBeInTheDocument();
    expect(screen.queryByText('iPhone 15 Pro')).not.toBeInTheDocument();
  });

  test('filter is case-insensitive', async () => {
    const user = userEvent.setup();
    render(<DataTable data={sampleProducts} columns={productColumns} />);

    const filterInput = screen.getByLabelText(/filter table/i);

    await user.type(filterInput, 'MACBOOK');

    expect(screen.getByText('MacBook Pro 16"')).toBeInTheDocument();
  });

  test('filter matches any column', async () => {
    const user = userEvent.setup();
    render(<DataTable data={sampleProducts} columns={productColumns} />);

    const filterInput = screen.getByLabelText(/filter table/i);

    // Search by category
    await user.type(filterInput, 'Furniture');

    expect(screen.getByText('Standing Desk')).toBeInTheDocument();
    expect(screen.getByText('Ergonomic Chair')).toBeInTheDocument();
  });

  test('shows "no results" for non-matching filter', async () => {
    const user = userEvent.setup();
    render(<DataTable data={sampleProducts} columns={productColumns} />);

    const filterInput = screen.getByLabelText(/filter table/i);

    await user.type(filterInput, 'nonexistent product xyz');

    expect(screen.getByText('No matching results')).toBeInTheDocument();
  });

  test('clear button appears when filter has text', async () => {
    const user = userEvent.setup();
    render(<DataTable data={sampleProducts} columns={productColumns} />);

    const filterInput = screen.getByLabelText(/filter table/i);

    // No clear button initially
    expect(screen.queryByLabelText(/clear filter/i)).not.toBeInTheDocument();

    await user.type(filterInput, 'test');

    // Clear button (X) appears in the input
    expect(screen.getByLabelText('Clear filter')).toBeInTheDocument();
  });

  test('clicking clear button clears filter', async () => {
    const user = userEvent.setup();
    render(<DataTable data={sampleProducts} columns={productColumns} />);

    const filterInput = screen.getByLabelText(/filter table/i);

    await user.type(filterInput, 'MacBook');
    expect(filterInput).toHaveValue('MacBook');

    const clearButton = screen.getByLabelText('Clear filter');
    await user.click(clearButton);

    expect(filterInput).toHaveValue('');
    expect(screen.getByText('iPhone 15 Pro')).toBeInTheDocument();
  });

  test('filtering resets to page 1', async () => {
    const user = userEvent.setup();
    render(<DataTable data={sampleProducts} columns={productColumns} initialPageSize={5} />);

    // Go to page 2
    const nextButton = screen.getByLabelText(/next page/i);
    await user.click(nextButton);

    expect(screen.getByText(withSplitText(/page 2 of/i))).toBeInTheDocument();

    // Apply filter
    const filterInput = screen.getByLabelText(/filter table/i);
    await user.type(filterInput, 'Chair');

    // Should reset to page 1
    expect(screen.getByText(withSplitText(/page 1 of/i))).toBeInTheDocument();
  });

  test('shows filtered count', async () => {
    const user = userEvent.setup();
    render(<DataTable data={sampleProducts} columns={productColumns} />);

    const filterInput = screen.getByLabelText(/filter table/i);

    await user.type(filterInput, 'Electronics');

    expect(screen.getByText(/filtered from 20/i)).toBeInTheDocument();
  });

  test('filter preserves sort state', async () => {
    const user = userEvent.setup();
    render(<DataTable data={sampleProducts} columns={productColumns} />);

    // Sort by price
    const priceHeader = screen.getByText('Price').closest('th');
    await user.click(priceHeader!);
    expect(priceHeader).toContainHTML('↑');

    // Apply filter
    const filterInput = screen.getByLabelText(/filter table/i);
    await user.type(filterInput, 'Electronics');

    // Sort indicator should still be present
    expect(priceHeader).toContainHTML('↑');
  });

  test('handles leading and trailing spaces', async () => {
    const user = userEvent.setup();
    render(<DataTable data={sampleProducts} columns={productColumns} />);

    const filterInput = screen.getByLabelText(/filter table/i);

    await user.type(filterInput, '  MacBook  ');

    expect(screen.getByText('MacBook Pro 16"')).toBeInTheDocument();
  });

  test('empty filter shows all data', async () => {
    const user = userEvent.setup();
    render(<DataTable data={sampleProducts} columns={productColumns} initialPageSize={20} />);

    const filterInput = screen.getByLabelText(/filter table/i);

    // Type and then clear
    await user.type(filterInput, 'test');
    await user.clear(filterInput);

    // All data should be visible
    expect(screen.getByText('MacBook Pro 16"')).toBeInTheDocument();
    expect(screen.getByText('iPhone 15 Pro')).toBeInTheDocument();
  });

  test('filter matches partial strings', async () => {
    const user = userEvent.setup();
    render(<DataTable data={sampleProducts} columns={productColumns} />);

    const filterInput = screen.getByLabelText(/filter table/i);

    await user.type(filterInput, 'Book');

    expect(screen.getByText('MacBook Pro 16"')).toBeInTheDocument();
    expect(screen.getByText('Bookshelf')).toBeInTheDocument();
  });

  test('clear filter link in empty state works', async () => {
    const user = userEvent.setup();
    render(<DataTable data={sampleProducts} columns={productColumns} />);

    const filterInput = screen.getByLabelText(/filter table/i);

    await user.type(filterInput, 'nonexistent');

    // Click clear filter link in empty state
    const clearLink = screen.getByRole('button', { name: /clear filter and show all results/i });
    await user.click(clearLink);

    expect(filterInput).toHaveValue('');
    expect(screen.getByText('iPhone 15 Pro')).toBeInTheDocument();
  });
});
