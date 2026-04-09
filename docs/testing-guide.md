# Developer Testing Guide

This guide outlines the testing strategy, tools, and best practices for the VendorFlow Hub project.

## Testing Stack

- **Unit/Integration Testing**: [Vitest](https://vitest.dev/) with [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- **E2E Testing**: [Playwright](https://playwright.dev/)
- **Environment**: [jsdom](https://github.com/jsdom/jsdom)

## Directory Structure

- `src/test/`: Global test setup and common unit tests.
  - `setup.ts`: Vitest global setup (mocks, polyfills).
  - `example.test.ts`: Reference unit test.
- `tests/e2e/`: Playwright E2E tests.
  - `01-auth.spec.ts`: Authentication flows.
  - `02-navigation.spec.ts`: Core navigation.
  - `03-page-smoke.spec.ts`: Basic page availability.
  - `04-interactive.spec.ts`: User interaction tests.
  - `helpers/`: Shared E2E utilities and mocks.

## Running Tests

### Unit & Integration Tests
```bash
# Run all tests once
npm run test

# Run tests in watch mode
npm run test:watch
```

### E2E Tests
```bash
# Run all E2E tests
npx playwright test

# Run E2E tests in UI mode
npx playwright test --ui
```

## Best Practices

### 1. Component Testing
- Prefer testing behavior over implementation details.
- Use `screen.getByRole` or `screen.getByLabelText` to ensure accessibility.
- Mock external services (Supabase, API) using Vitest mocks or MSW (if added).

### 2. E2E Testing
- Focus on critical user journeys (Login, Lead Management, Inventory Sync).
- Use `data-testid` only when no accessible selector exists.
- Keep tests independent; use helpers for repetitive setup like authentication.

### 3. Writing New Tests
- For **Utilities/Hooks**: Use Vitest in `src/test/` or alongside the source file with `.test.ts`.
- For **Components**: Use Vitest + React Testing Library.
- For **User Flows**: Use Playwright in `tests/e2e/`.

## Common Tasks

### Mocking window.matchMedia
Already configured in `src/test/setup.ts`.

### Authentication in E2E
Use the helpers in `tests/e2e/helpers/mock-auth.ts` to bypass or mock login states during development.

## CI/CD
Tests are intended to run on every Pull Request to ensure no regressions.
