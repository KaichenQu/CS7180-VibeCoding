# Data Table Application

A modern, feature-rich employee directory built with React, TypeScript, Vite, and Tailwind CSS. This application demonstrates advanced table functionality including filtering, sorting, and pagination.

## Features

- **Search/Filter**: Search across all columns in real-time
- **Sorting**: Sort by any column (ascending, descending, or no sort)
- **Pagination**: Navigate through data with customizable rows per page
- **Responsive Design**: Built with Tailwind CSS for a modern, responsive UI
- **TypeScript**: Full type safety throughout the application
- **Comprehensive Tests**: 89 tests covering all functionality with Vitest

## Project Structure

```
src/
├── components/
│   ├── DataTable.tsx          # Main data table component
│   └── DataTable.test.tsx     # Component integration tests
├── data/
│   └── sampleData.ts          # Sample employee data
├── types/
│   └── Person.ts              # TypeScript interfaces and types
├── utils/
│   ├── dataTableUtils.ts      # Utility functions for filtering, sorting, pagination
│   └── dataTableUtils.test.ts # Unit tests for utility functions
├── test/
│   └── setup.ts               # Vitest setup configuration
├── App.tsx                    # Main app component
├── main.tsx                   # Application entry point
└── index.css                  # Global styles with Tailwind directives
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

### Development

Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Building for Production

Build the application:
```bash
npm run build
```

Preview the production build:
```bash
npm run preview
```

## Testing

### Run all tests:
```bash
npm test
```

### Run tests in watch mode:
```bash
npm run test:watch
```

### Run tests with UI:
```bash
npm run test:ui
```

### Generate coverage report:
```bash
npm run test:coverage
```

## Test Coverage

The project includes comprehensive test coverage:

- **89 total tests**
- **Component tests**: 44 tests covering all UI interactions
- **Utility function tests**: 45 tests for core logic

### Test Categories:

1. **Initial Rendering** - Verifies correct component initialization
2. **Filtering** - Tests search across all columns, case-insensitive matching
3. **Sorting** - Tests ascending/descending sort for all data types
4. **Pagination** - Tests page navigation and rows per page controls
5. **Combined Functionality** - Tests interactions between filter, sort, and pagination
6. **Data Formatting** - Tests proper display of salary, dates, and badges
7. **Utility Functions** - Unit tests for all helper functions

## Usage

### Searching

Type in the search box to filter employees across all fields (name, email, department, role, salary, start date).

### Sorting

Click any column header to sort:
- First click: Sort ascending (↑)
- Second click: Sort descending (↓)
- Third click: Clear sort (↕)

### Pagination

- Use arrow buttons to navigate: « (first), ‹ (previous), › (next), » (last)
- Change rows per page: Select 5, 10, or 15 from the dropdown
- Current page and total pages are always displayed

## Technologies Used

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **Vitest** - Testing framework
- **Testing Library** - React component testing

## Key Functions

### Filtering
- Searches across all object properties
- Case-insensitive matching
- Partial string matching
- Resets to page 1 on filter change

### Sorting
- Supports both numeric and string sorting
- Three-state sort: asc → desc → none
- Maintains sort when filtering
- Uses `localeCompare` for string comparison

### Pagination
- Configurable rows per page (5, 10, 15)
- Dynamic page calculation
- Disabled buttons at boundaries
- Resets to page 1 on filter or rows per page change

## License

MIT
