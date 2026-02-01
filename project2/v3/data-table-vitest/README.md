# DataTable Component - React + TypeScript + Vitest

A production-ready, fully-featured DataTable component built with React, TypeScript, and Tailwind CSS. Features comprehensive sorting, filtering, pagination, and accessibility support.

## Features

### Core Functionality
- **Advanced Filtering**: Real-time search across all columns with case-insensitive matching
- **Stable Sorting**: Click column headers to sort (cycles: none → ascending → descending → none)
- **Smart Pagination**: Configurable page sizes with boundary-safe navigation
- **Type Safety**: Full TypeScript support with generic type parameters

### User Experience
- **Responsive Design**: Mobile-friendly with Tailwind CSS
- **Visual Feedback**: Hover effects, sort indicators, and loading states
- **Empty States**: Graceful handling of no data and no search results
- **Custom Rendering**: Support for custom cell renderers

### Accessibility (a11y)
- ARIA labels and live regions for screen readers
- Keyboard navigation support (Enter/Space on headers)
- Semantic HTML structure
- Focus management

### Data Flow Architecture
```
Raw Data → Filter → Sort (stable) → Paginate → Display
```

## Quick Start

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```
Opens at http://localhost:5173

### Testing

```bash
# Run tests in watch mode
npm test

# Run tests with UI
npm run test:ui

# Generate coverage report
npm run test:coverage
```

### Build

```bash
npm run build
```

## Project Structure

```
src/
├── components/
│   └── DataTable/
│       ├── DataTable.tsx           # Main component
│       ├── DataTable.types.ts      # Type definitions
│       ├── DataTable.utils.ts      # Utility functions
│       └── __tests__/              # Comprehensive test suites
│           ├── DataTable.test.tsx
│           ├── DataTable.sorting.test.tsx
│           ├── DataTable.filtering.test.tsx
│           └── DataTable.pagination.test.tsx
├── data/
│   └── sampleData.tsx              # Sample product data
├── App.tsx                         # Demo application
└── main.tsx                        # Entry point
```

## Usage Example

```typescript
import { DataTable } from './components/DataTable/DataTable';
import type { ColumnDefinition, RowData } from './components/DataTable/DataTable.types';

interface Product extends RowData {
  id: number;
  name: string;
  price: number;
  stock: number;
}

const columns: ColumnDefinition<Product>[] = [
  {
    key: 'name',
    header: 'Product Name',
    sortable: true,
  },
  {
    key: 'price',
    header: 'Price',
    align: 'right',
    render: (value) => `$${Number(value).toFixed(2)}`,
  },
  {
    key: 'stock',
    header: 'Stock',
    align: 'right',
  },
];

const products: Product[] = [
  { id: 1, name: 'Widget', price: 19.99, stock: 100 },
  { id: 2, name: 'Gadget', price: 29.99, stock: 50 },
];

function App() {
  return (
    <DataTable
      data={products}
      columns={columns}
      initialPageSize={10}
      pageSizeOptions={[5, 10, 20, 50]}
      caption="Product inventory table"
    />
  );
}
```

## Column Definition Options

```typescript
interface ColumnDefinition<T> {
  key: keyof T;                    // Required: Property key from data
  header: string;                   // Required: Display header text
  sortable?: boolean;               // Optional: Enable sorting (default: true)
  width?: string;                   // Optional: CSS width value
  align?: 'left' | 'center' | 'right'; // Optional: Text alignment
  render?: (value: any, row: T, index: number) => ReactNode; // Optional: Custom renderer
}
```

## Component Props

```typescript
interface DataTableProps<T extends RowData> {
  data: T[];                        // Required: Array of data rows
  columns: ColumnDefinition<T>[];   // Required: Column definitions
  initialPageSize?: number;         // Optional: Starting page size (default: 10)
  pageSizeOptions?: number[];       // Optional: Available sizes (default: [5, 10, 20, 50])
  caption?: string;                 // Optional: Table caption for a11y
  className?: string;               // Optional: Additional CSS classes
}
```

## Edge Cases Handled

✅ Empty dataset with appropriate messaging
✅ No filter matches with clear filter option
✅ Page overflow auto-correction
✅ Stable sort maintaining relative order
✅ Null/undefined value handling
✅ Mixed type comparison (numbers, strings, dates)
✅ Boundary button disabling
✅ Keyboard navigation
✅ Filter + sort + pagination state persistence

## Testing

Comprehensive test coverage using Vitest and React Testing Library:

- **Component Tests**: Rendering, props, empty states
- **Sorting Tests**: All sort directions, stable sort behavior
- **Filtering Tests**: Search functionality, result counts
- **Pagination Tests**: Navigation, page size changes, boundaries
- **Utility Tests**: Helper functions, edge cases

Run with:
```bash
npm run test:ui
```

## Screenshots

See [SCREENSHOTS.md](./SCREENSHOTS.md) for visual documentation of:
- Main interface with all features
- Vitest UI test runner
- Coverage reports

## Technical Details

### TypeScript Configuration
- `verbatimModuleSyntax: true` for explicit type imports
- Strict mode enabled
- Path aliases (`@/*` → `src/*`)

### Performance Optimizations
- Memoized filtering, sorting, and pagination
- Stable references with `useCallback`
- Efficient re-renders with React.memo patterns

### Sorting Algorithm
Implements stable sort with original index tiebreaker:
1. Wrap rows with index
2. Compare values (null/undefined sorted to end)
3. Break ties using original index
4. Unwrap sorted rows

## Tech Stack

- **React 18** - UI library
- **TypeScript 5.9** - Type safety
- **Vite** - Build tool and dev server
- **Vitest** - Unit testing framework
- **React Testing Library** - Component testing
- **Tailwind CSS** - Styling
- **ESLint** - Code quality

## Browser Support

Modern browsers supporting ES2022:
- Chrome 94+
- Firefox 93+
- Safari 15+
- Edge 94+

## License

MIT

## Contributing

This is a homework/educational project. Feel free to use as reference or template for your own projects.

---

Built with ❤️ using React + TypeScript + Vite
