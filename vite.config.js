import { defineConfig } from 'vite';
import { resolve } from 'path';
import fs from 'fs';

// Find all HTML files in the root directory
const files = fs.readdirSync(__dirname).filter(file => file.endsWith('.html'));

const inputs = {};
files.forEach(file => {
  const name = file.replace('.html', '');
  inputs[name] = resolve(__dirname, file);
});

export default defineConfig({
  build: {
    rollupOptions: {
      input: inputs
    }
  }
});
