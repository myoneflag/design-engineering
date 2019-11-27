module.exports = {
  'check-coverage': false,
  'per-file': true,
  'skip-full': true,
  all: true,
  include: [
    'src/**/*.{js,ts}'
  ],
  exclude: [
    'src/*.js',
    '**/index.js',
  ],
  reporter: [
    'lcov',
    'text',
    'text-summary'
  ],
  extension: [
    '.js',
    '.ts',
    '.vue'
  ],
};
