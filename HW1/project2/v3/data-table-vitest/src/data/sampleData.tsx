import type { RowData, ColumnDefinition } from '@/components/DataTable/DataTable.types';

// ════════════════════════════════════════════════════════════════════════════════
// SAMPLE DATA
// ════════════════════════════════════════════════════════════════════════════════

/** Sample data model */
export interface Product extends RowData {
  id: number;
  name: string;
  category: string;
  price: number;
  stock: number;
  rating: number;
  lastUpdated: string;
}

/** Sample product dataset */
export const sampleProducts: Product[] = [
  { id: 1, name: 'MacBook Pro 16"', category: 'Electronics', price: 2499, stock: 45, rating: 4.8, lastUpdated: '2024-01-15' },
  { id: 2, name: 'iPhone 15 Pro', category: 'Electronics', price: 1199, stock: 120, rating: 4.7, lastUpdated: '2024-01-20' },
  { id: 3, name: 'AirPods Pro', category: 'Electronics', price: 249, stock: 300, rating: 4.6, lastUpdated: '2024-01-18' },
  { id: 4, name: 'Standing Desk', category: 'Furniture', price: 599, stock: 25, rating: 4.5, lastUpdated: '2024-01-10' },
  { id: 5, name: 'Ergonomic Chair', category: 'Furniture', price: 449, stock: 50, rating: 4.4, lastUpdated: '2024-01-12' },
  { id: 6, name: 'Mechanical Keyboard', category: 'Accessories', price: 179, stock: 80, rating: 4.7, lastUpdated: '2024-01-22' },
  { id: 7, name: 'Wireless Mouse', category: 'Accessories', price: 79, stock: 150, rating: 4.3, lastUpdated: '2024-01-19' },
  { id: 8, name: '4K Monitor', category: 'Electronics', price: 699, stock: 35, rating: 4.6, lastUpdated: '2024-01-14' },
  { id: 9, name: 'USB-C Hub', category: 'Accessories', price: 89, stock: 200, rating: 4.2, lastUpdated: '2024-01-21' },
  { id: 10, name: 'Webcam HD', category: 'Electronics', price: 129, stock: 90, rating: 4.1, lastUpdated: '2024-01-17' },
  { id: 11, name: 'Desk Lamp', category: 'Furniture', price: 59, stock: 75, rating: 4.0, lastUpdated: '2024-01-11' },
  { id: 12, name: 'Monitor Arm', category: 'Furniture', price: 119, stock: 60, rating: 4.4, lastUpdated: '2024-01-13' },
  { id: 13, name: 'Cable Management Kit', category: 'Accessories', price: 29, stock: 250, rating: 4.2, lastUpdated: '2024-01-23' },
  { id: 14, name: 'Laptop Stand', category: 'Accessories', price: 49, stock: 110, rating: 4.5, lastUpdated: '2024-01-16' },
  { id: 15, name: 'Noise Canceling Headphones', category: 'Electronics', price: 349, stock: 55, rating: 4.8, lastUpdated: '2024-01-24' },
  { id: 16, name: 'Smart Speaker', category: 'Electronics', price: 99, stock: 180, rating: 4.3, lastUpdated: '2024-01-25' },
  { id: 17, name: 'Wireless Charger', category: 'Accessories', price: 39, stock: 220, rating: 4.1, lastUpdated: '2024-01-26' },
  { id: 18, name: 'Filing Cabinet', category: 'Furniture', price: 199, stock: 30, rating: 3.9, lastUpdated: '2024-01-08' },
  { id: 19, name: 'Bookshelf', category: 'Furniture', price: 149, stock: 40, rating: 4.2, lastUpdated: '2024-01-09' },
  { id: 20, name: 'Tablet Stand', category: 'Accessories', price: 35, stock: 130, rating: 4.0, lastUpdated: '2024-01-27' },
];

/** Column definitions */
export const productColumns: ColumnDefinition<Product>[] = [
  {
    key: 'name',
    header: 'Product Name',
    width: '200px',
  },
  {
    key: 'category',
    header: 'Category',
    render: (value) => (
      <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full
        ${value === 'Electronics' ? 'bg-blue-100 text-blue-800' :
          value === 'Furniture' ? 'bg-amber-100 text-amber-800' :
          'bg-gray-100 text-gray-800'}`}>
        {String(value)}
      </span>
    ),
  },
  {
    key: 'price',
    header: 'Price',
    align: 'right',
    render: (value) => (
      <span className="font-mono font-medium">${Number(value).toLocaleString()}</span>
    ),
  },
  {
    key: 'stock',
    header: 'Stock',
    align: 'right',
    render: (value) => {
      const stock = Number(value);
      return (
        <span className={stock < 50 ? 'text-red-600 font-medium' : ''}>
          {stock.toLocaleString()}
        </span>
      );
    },
  },
  {
    key: 'rating',
    header: 'Rating',
    align: 'center',
    render: (value) => {
      const rating = Number(value);
      return (
        <div className="flex items-center justify-center gap-1">
          <svg className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          <span className="font-medium">{rating.toFixed(1)}</span>
        </div>
      );
    },
  },
  {
    key: 'lastUpdated',
    header: 'Last Updated',
    render: (value) => new Date(String(value)).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }),
  },
];
