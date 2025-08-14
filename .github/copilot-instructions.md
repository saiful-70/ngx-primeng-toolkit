<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# PrimeNG Table State Helper - Copilot Instructions

This is a TypeScript npm package for advanced PrimeNG table state management in Angular applications with NgRx Signals integration.

## Project Context
- **Purpose**: Utility library for PrimeNG table state management with lazy loading, filtering, sorting, and pagination
- **Target Framework**: Angular with PrimeNG 19+, NgRx Signals, and RxJS
- **Package Type**: TypeScript library with ESM/CJS dual output
- **Build Tool**: tsup for fast bundling

## Code Style Guidelines
- Use TypeScript with strict mode enabled
- Export functions and classes with clear JSDoc documentation
- Prefer functional programming patterns where appropriate
- Use meaningful function, class, and variable names
- Include comprehensive type definitions
- Follow Angular best practices and conventions

## Architecture Patterns
- Core table state management in `src/table-state-helper.ts`
- Table configuration utilities in `src/table-utils.ts`
- Main exports in `src/index.ts`
- Tree-shakeable exports for optimal bundle size
- Use NgRx Signals for reactive state management
- Follow singleton pattern for state helper instances

## Dependencies
- Peer dependencies: `@angular/common`, `@angular/core`, `@ngrx/signals`, `primeng`, `rxjs`
- Optional peer dependencies: `zod` for response validation
- Build dependencies: `typescript`, `tsup`, `@types/node`
- No runtime dependencies to keep package lightweight

## Key Classes and Functions to Maintain
- `PrimeNgTableStateHelper<T>`: Main state management class
- `createTextColumn()`, `createNumericColumn()`, `createBooleanColumn()`: Column configuration utilities
- `createPrimengStringMatchModes()`, `createPrimengNumberMatchModes()`: Filter mode utilities
- `DynamicQueryDto`, `DynamicQueryFilterDto`, `DynamicQuerySortDto`: API interfaces
- `PrimeNgTableHeader`: Table header configuration interface

## State Management Patterns
- Use signalState for internal state management
- Expose readonly signals for data, loading, and totalRecords
- Implement proper state initialization and cleanup
- Handle async operations with proper error handling
- Use patchState for state updates

## API Integration Patterns
- Support POST requests with structured query DTOs
- Handle pagination, filtering, and sorting in API calls
- Map PrimeNG filter types to backend filter operations
- Support dynamic URL and query parameter configuration
- Include optional HTTP context for loading spinner control

## Testing Considerations
- Test table state management thoroughly
- Verify API request/response handling
- Test filter type mappings
- Validate pagination and sorting logic
- Test error handling scenarios
- Verify TypeScript type definitions

## Build Process
- `npm run build`: Build distribution files
- `npm run dev`: Watch mode for development
- `npm run type-check`: TypeScript validation
- Output: ESM and CJS formats with type definitions
