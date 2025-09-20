# JSONIC Integration Issues for GitHub Pages

## Current Problems

1. **Script Loading Timing Issue**
   - When loading JSONIC as an external script (`<script src="jsonic.min.js">`), the library isn't available when React initializes
   - The global `JSONIC` object is not immediately available after the script tag
   - Even with a 5-second wait mechanism, `window.JSONIC` remains undefined on GitHub Pages

2. **Bundling Issues**
   - The minified file (`jsonic.min.js`) cannot be imported as an ES module
   - The file appears to be a single-line UMD bundle that causes parse errors when imported directly
   - Vite/Rollup cannot parse the minified JavaScript: "Expected '}', got '<eof>'"

3. **Module Format Incompatibility**
   - The current standalone build uses UMD format which doesn't play well with modern ES module bundlers
   - Cannot use `import` statement to load JSONIC synchronously

## Suggested Solutions for JSONIC Developers

### 1. Provide an ES Module Build
Create a proper ES module version that can be imported:
```javascript
// jsonic.esm.js
export const JSONIC = {
  createDatabase: async () => { /* ... */ }
};
export default JSONIC;
```

This would allow:
```javascript
import JSONIC from 'jsonic/dist/jsonic.esm.js';
```

### 2. NPM Package with Proper Module Exports
Publish JSONIC as an NPM package with proper package.json exports:
```json
{
  "name": "jsonic-db",
  "exports": {
    ".": {
      "import": "./dist/jsonic.esm.js",
      "require": "./dist/jsonic.cjs.js",
      "browser": "./dist/jsonic.browser.js"
    }
  },
  "module": "./dist/jsonic.esm.js",
  "main": "./dist/jsonic.cjs.js",
  "browser": "./dist/jsonic.browser.js"
}
```

### 3. Initialization Promise
Provide a way to wait for JSONIC to be ready:
```javascript
window.JSONIC_READY = new Promise((resolve) => {
  // Initialize JSONIC
  window.JSONIC = { /* ... */ };
  resolve(window.JSONIC);
});
```

Usage:
```javascript
const JSONIC = await window.JSONIC_READY;
const db = await JSONIC.createDatabase();
```

### 4. Self-Initializing Module
Make the script self-initialize and dispatch an event:
```javascript
// At the end of jsonic.js
window.JSONIC = { /* ... */ };
window.dispatchEvent(new CustomEvent('jsonic-ready', { detail: window.JSONIC }));
```

### 5. TypeScript Definitions
Provide TypeScript definitions for better integration:
```typescript
declare module 'jsonic-db' {
  export interface JsonicDatabase {
    insert(data: any): Promise<string>;
    get(id: string): Promise<any>;
    update(id: string, data: any): Promise<void>;
    delete(id: string): Promise<void>;
    list_ids(): Promise<string[]>;
    stats(): Promise<any>;
  }
  
  export interface JSONIC {
    createDatabase(): Promise<JsonicDatabase>;
  }
  
  const JSONIC: JSONIC;
  export default JSONIC;
}
```

## Current Workaround Attempts

1. **External Script with Wait** - Doesn't work on GitHub Pages
2. **Direct Import** - Parse errors due to minified UMD format
3. **Dynamic Import** - Same timing issues as external script

## Ideal Integration

For modern web applications, the ideal integration would be:

```javascript
import JSONIC from 'jsonic-db';

const db = await JSONIC.createDatabase();
await db.insert({ name: 'test' });
```

This requires JSONIC to be available as a proper ES module that can be bundled with the application.