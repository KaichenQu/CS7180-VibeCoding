import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DataTable } from '../DataTable';
import { sampleProducts, productColumns } from '@/data/sampleData';
import { withSplitText } from './test-utils';

describe('DataTable - Pagination', () => {
  test('displays correct page size', async () => {
    render(<DataTable data={sampleProducts} columns={productColumns} initialPageSize={5} />);

    expect(screen.getByText(withSplitText(/showing 1–5 of 20/i))).toBeInTheDocument();
  });

  test('next button navigates to next page', async () => {
    const user = userEvent.setup();
    render(<DataTable data={sampleProducts} columns={productColumns} initialPageSize={5} />);

    const nextButton = screen.getByLabelText(/next page/i);
    await user.click(nextButton);

    expect(screen.getByText(withSplitText(/page 2 of/i))).toBeInTheDocument();
    expect(screen.getByText(withSplitText(/showing 6–10 of 20/i))).toBeInTheDocument();
  });

  test('previous button navigates to previous page', async () => {
    const user = userEvent.setup();
    render(<DataTable data={sampleProducts} columns={productColumns} initialPageSize={5} />);

    const nextButton = screen.getByLabelText(/next page/i);
    const prevButton = screen.getByLabelText(/previous page/i);

    await user.click(nextButton);
    await user.click(prevButton);

    expect(screen.getByText(withSplitText(/page 1 of/i))).toBeInTheDocument();
  });

  test('first button jumps to first page', async () => {
    const user = userEvent.setup();
    render(<DataTable data={sampleProducts} columns={productColumns} initialPageSize={5} />);

    const nextButton = screen.getByLabelText(/next page/i);
    const firstButton = screen.getByLabelText(/first page/i);

    await user.click(nextButton);
    await user.click(nextButton);
    expect(screen.getByText(withSplitText(/page 3 of/i))).toBeInTheDocument();

    await user.click(firstButton);
    expect(screen.getByText(withSplitText(/page 1 of/i))).toBeInTheDocument();
  });

  test('last button jumps to last page', async () => {
    const user = userEvent.setup();
    render(<DataTable data={sampleProducts} columns={productColumns} initialPageSize={5} />);

    const lastButton = screen.getByLabelText(/last page/i);
    await user.click(lastButton);

    expect(screen.getByText(withSplitText(/page 4 of/i))).toBeInTheDocument();
  });

  test('first and prev buttons disabled on first page', () => {
    render(<DataTable data={sampleProducts} columns={productColumns} initialPageSize={5} />);

    const firstButton = screen.getByLabelText(/first page/i);
    const prevButton = screen.getByLabelText(/previous page/i);

    expect(firstButton).toBeDisabled();
    expect(prevButton).toBeDisabled();
  });

  test('next and last buttons disabled on last page', async () => {
    const user = userEvent.setup();
    render(<DataTable data={sampleProducts} columns={productColumns} initialPageSize={5} />);

    const lastButton = screen.getByLabelText(/last page/i);
    await user.click(lastButton);

    const nextButton = screen.getByLabelText(/next page/i);

    expect(nextButton).toBeDisabled();
    expect(lastButton).toBeDisabled();
  });

  test('changing page size resets to page 1', async () => {
    const user = userEvent.setup();
    render(
      <DataTable
        data={sampleProducts}
        columns={productColumns}
        initialPageSize={5}
        pageSizeOptions={[5, 10, 20]}
      />
    );

    // Go to page 2
    const nextButton = screen.getByLabelText(/next page/i);
    await user.click(nextButton);
    expect(screen.getByText(withSplitText(/page 2 of/i))).toBeInTheDocument();

    // Change page size
    const pageSizeSelect = screen.getByLabelText(/rows per page/i);
    await user.selectOptions(pageSizeSelect, '10');

    // Should reset to page 1
    expect(screen.getByText(withSplitText(/page 1 of/i))).toBeInTheDocument();
    expect(screen.getByText(withSplitText(/showing 1–10 of 20/i))).toBeInTheDocument();
  });

  test('page size options rendered correctly', () => {
    render(
      <DataTable
        data={sampleProducts}
        columns={productColumns}
        pageSizeOptions={[5, 10, 20, 50]}
      />
    );

    const select = screen.getByLabelText(/rows per page/i);
    const options = Array.from(select.querySelectorAll('option'));

    expect(options).toHaveLength(4);
    expect(options[0]).toHaveValue('5');
    expect(options[1]).toHaveValue('10');
    expect(options[2]).toHaveValue('20');
    expect(options[3]).toHaveValue('50');
  });

  test('auto-clamps page when filter reduces results', async () => {
    const user = userEvent.setup();
    render(<DataTable data={sampleProducts} columns={productColumns} initialPageSize={5} />);

    // Go to page 4 (last page)
    const lastButton = screen.getByLabelText(/last page/i);
    await user.click(lastButton);
    expect(screen.getByText(withSplitText(/page 4 of/i))).toBeInTheDocument();

    // Apply filter that returns only 1 result
    const filterInput = screen.getByLabelText(/filter table/i);
    await user.type(filterInput, 'MacBook Pro 16');

    // Should auto-clamp to page 1
    expect(screen.getByText(withSplitText(/page 1 of 1/i))).toBeInTheDocument();
  });

  test('shows correct total pages', () => {
    render(<DataTable data={sampleProducts} columns={productColumns} initialPageSize={7} />);

    // 20 items / 7 per page = 3 pages
    expect(screen.getByText(withSplitText(/page 1 of 3/i))).toBeInTheDocument();
  });

  test('empty data shows page 1 of 1', () => {
    render(<DataTable data={[]} columns={productColumns} />);

    expect(screen.getByText(withSplitText(/page 1 of 1/i))).toBeInTheDocument();
    expect(screen.getByText('No results')).toBeInTheDocument();
  });

  test('shows correct items on each page', async () => {
    const user = userEvent.setup();
    render(<DataTable data={sampleProducts} columns={productColumns} initialPageSize={5} />);

    // Page 1: items 1-5
    expect(screen.getByText(withSplitText(/showing 1–5 of 20/i))).toBeInTheDocument();

    // Page 2: items 6-10
    await user.click(screen.getByLabelText(/next page/i));
    expect(screen.getByText(withSplitText(/showing 6–10 of 20/i))).toBeInTheDocument();

    // Page 3: items 11-15
    await user.click(screen.getByLabelText(/next page/i));
    expect(screen.getByText(withSplitText(/showing 11–15 of 20/i))).toBeInTheDocument();

    // Page 4: items 16-20
    await user.click(screen.getByLabelText(/next page/i));
    expect(screen.getByText(withSplitText(/showing 16–20 of 20/i))).toBeInTheDocument();
  });

  test('displays correct current page number', async () => {
    const user = userEvent.setup();
    render(<DataTable data={sampleProducts} columns={productColumns} initialPageSize={5} />);

    expect(screen.getByText(withSplitText(/page 1 of 4/i))).toBeInTheDocument();

    await user.click(screen.getByLabelText(/next page/i));
    expect(screen.getByText(withSplitText(/page 2 of 4/i))).toBeInTheDocument();

    await user.click(screen.getByLabelText(/next page/i));
    expect(screen.getByText(withSplitText(/page 3 of 4/i))).toBeInTheDocument();
  });

  test('pagination controls have correct aria labels', () => {
    render(<DataTable data={sampleProducts} columns={productColumns} />);

    expect(screen.getByLabelText(/go to first page/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/go to previous page/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/go to next page/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/go to last page/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/rows per page/i)).toBeInTheDocument();
  });

  test('handles single page of data', () => {
    const smallData = sampleProducts.slice(0, 3);
    render(<DataTable data={smallData} columns={productColumns} initialPageSize={10} />);

    expect(screen.getByText(withSplitText(/page 1 of 1/i))).toBeInTheDocument();
    expect(screen.getByText(withSplitText(/showing 1–3 of 3/i))).toBeInTheDocument();

    const nextButton = screen.getByLabelText(/next page/i);
    const lastButton = screen.getByLabelText(/last page/i);

    expect(nextButton).toBeDisabled();
    expect(lastButton).toBeDisabled();
  });
});
