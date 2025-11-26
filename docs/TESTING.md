# Testing Guide

## Setup

```bash
npm install
npm run test
```

## Running Tests

### Unit Tests
```bash
npm run test
```

### Watch Mode
```bash
npm run test:watch
```

### Coverage Report
```bash
npm run test:coverage
```

### UI Mode
```bash
npm run test:ui
```

## Test Structure

### Component Tests
```typescript
import { render, screen } from '@testing-library/react'
import { Dashboard } from '@/pages/Dashboard'

describe('Dashboard', () => {
  it('renders portfolio value', () => {
    render(<Dashboard />)
    expect(screen.getByText(/Total Capital/i)).toBeInTheDocument()
  })
})
```

### Hook Tests
```typescript
import { renderHook } from '@testing-library/react'
import { useWallet } from '@/hooks/useWallet'

describe('useWallet', () => {
  it('connects wallet', async () => {
    const { result } = renderHook(() => useWallet())
    await result.current.connect()
    expect(result.current.isConnected).toBe(true)
  })
})
```

## Smart Contract Tests

### Using Hardhat
```bash
cd contracts
npx hardhat test
```

### Test Coverage
```bash
npx hardhat coverage
```

## E2E Tests (Coming Soon)

### Playwright
```bash
npm run test:e2e
```

## CI/CD Testing

Tests run automatically on:
- Pull requests
- Main branch commits
- Release tags

## Best Practices

1. **Arrange-Act-Assert Pattern**
2. **Mock External Dependencies**
3. **Test User Behavior, Not Implementation**
4. **Maintain >80% Coverage**
5. **Write Descriptive Test Names**

## Troubleshooting

### Tests Failing
- Clear cache: `npm run test -- --clearCache`
- Update snapshots: `npm run test -- -u`
- Check node_modules: `rm -rf node_modules && npm install`
