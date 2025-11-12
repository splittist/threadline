# Test Document Fixtures

This directory contains sample Word documents used for testing document parsing functionality.

## Document Descriptions

### `simple_word.docx`
- **Purpose**: Basic parsing of modern Word document
- **Content**: Plain text, single paragraph, no formatting
- **Tests**: Document loading, basic parsing

### `simple_google.docx`
- **Purpose**: Basic parsing of Google docs document
- **Content**: Plain text, single paragraph, no formatting
- **Tests**: Document loading, basic parsing

### `complex_formatting.docx`
- **Purpose**: Basic parsing of run-level formatting
- **Content**: Formatted text with multiple paragraphs and tracked changes
- **Tests**: Document loading, basic parsing

## Usage in Tests

```typescript
import { readFileSync } from 'fs';
import { resolve } from 'path';

const fixture = readFileSync(
  resolve(__dirname, '../fixtures/documents/simple.docx')
);
```

## Adding New Fixtures

1. Add the `.docx` file to this directory
2. Document its purpose and content in this README
3. Keep files under 5MB when possible (except performance test files)
4. Use descriptive filenames that indicate the test scenario