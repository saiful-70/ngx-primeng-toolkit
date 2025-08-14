# PrimeNG Table State Helper

A comprehensive TypeScript library for managing PrimeNG table state with lazy loading, filtering, sorting, and data storage utilities for Angular applications.

## 🚀 Features

### Table State Helpers
- **Dynamic Table State Helper**: Advanced table with filtering, sorting, and lazy loading
- **Paged Table State Helper**: Simple pagination without complex filtering
- **NgRx Signals Integration**: Modern state management with signals
- **Automatic API Integration**: Built-in HTTP client integration
- **Route Parameter Support**: Dynamic URL parameter handling
- **Query Parameter Management**: Flexible query string handling

### Data Storage Utilities
- **Memoized Data Storage**: Caching mechanism for API responses
- **Component Data Storage**: Centralized component data management
- **Component State Management**: UI state handling utilities
- **NgSelect Helper**: Advanced dropdown with virtual scrolling and search

### Type Safety & Utilities
- **Full TypeScript Support**: Complete type definitions
- **Zod Schema Validation**: Runtime type checking
- **Utility Functions**: Helper functions for common operations
- **PrimeNG Integration**: Seamless integration with PrimeNG components

## 📦 Installation

```bash
npm install primeng-table-state-helper
```

## 🏗️ Architecture

The library is organized into focused modules for better tree-shaking and maintainability:

```
src/
├── dynamic-table-state-helper.ts    # Advanced table with filtering & sorting
├── paged-table-state-helper.ts      # Simple pagination table
├── memoized-data-storage.ts         # Caching utilities
├── component-state.ts               # Component state management
├── component-data-storage.ts        # Data storage utilities
├── ng-select-helper.ts              # NgSelect integration
├── table-utils.ts                   # Table utility functions
├── http-context-tokens.ts           # HTTP context tokens
├── types.ts                         # Type definitions
└── index.ts                         # Main exports
```

## 🔧 Usage Examples

Check the `examples/comprehensive-usage.example.ts` file for a complete real-world implementation showing all features integrated together.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
