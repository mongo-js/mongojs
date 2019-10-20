module.exports = {
  env: {
    commonjs: true,
    es6: true,
    node: true
  },
  extends: [
    'standard'
  ],
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly'
  },
  parserOptions: {
    ecmaVersion: 2018
  },
  rules: {
    'no-var': 'error',
    'prefer-const': 'error',
    'no-buffer-constructor': 'error',
    'prefer-arrow-callback': 'error',
  }
}
