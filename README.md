# Ed2kChromePlugin

A Chrome extension designed for developers and users to quickly extract, filter, and batch copy `ed2k` and `magnet` links from web pages.

English | [中文](README.zh-CN.md)

## Key Features
- **Auto-Sniff**: Automatically identifies ed2k and magnet links within the page.
- **Smart Parsing**: Utilizes Cheerio and regex optimizations to extract filenames and sizes whenever possible.
- **Batch Operations**: Supports range selection, select all, and invert selection.
- **Keyword Search**: Real-time filename searching within the result list.
- **One-Click Copy**: Batch copy selected links to the clipboard.

## Tech Stack
- **Framework**: Vue 3 (Composition API)
- **UI Library**: Element Plus
- **Build Tool**: Vite
- **Parsing**: Cheerio, Lodash
- **Language**: TypeScript

## Development & Build

### Development Mode
```bash
npm run dev
```
Entry point is `index.html`.

### Build Extension
```bash
npm run build
```
The build artifacts are located in the `dist` directory. To load it, enable "Developer mode" in Chrome Extensions (`chrome://extensions/`), click "Load unpacked", and select the `dist` directory.

## Testing

To ensure robustness, the project includes a comprehensive testing suite:

### Unit Testing
Focuses on core regex parsing logic and data models.
```bash
npm test
```
Powered by **Vitest**.

### Functional Testing (E2E)
Simulates a real browser environment to test the end-to-end interaction between the popup and content scripts.
```bash
# Must build the extension first
npm run build
# Run E2E tests
npm run test:e2e
```
Powered by **Playwright**. It automatically launches Chromium, loads the extension, and verifies the scraping logic on a mock page.

## Directory Structure
- `src/composables`: Core business logic (link extraction, interaction state).
- `src/components`: Modular UI components.
- `src/types.ts`: Global type definitions and core regex patterns.
- `tests/`: E2E test scripts and mock data.

## Google Web Store
[View Extension](https://chrome.google.com/webstore/detail/kmeeplonmihpchdbfccgmjhcnpecbppk)
