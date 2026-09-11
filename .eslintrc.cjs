module.exports = {
  root: true,
  env: { browser: true, es2021: true },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: './tsconfig.json',
    ecmaFeatures: { jsx: true },
  },
  extends: ['airbnb', 'airbnb-typescript', 'airbnb/hooks', 'prettier'],
  plugins: ['@typescript-eslint', 'react', 'react-hooks'],
  settings: {
    react: { version: 'detect' },
  },
  ignorePatterns: ['dist', 'node_modules', '*.cjs', '*.config.ts'],
  rules: {
    // Vite 새 JSX 변환(jsx: "react-jsx") 사용 — React import 없이 JSX 사용, import 확장자 강제 안 함(TS 번들러 리졸버 기준).
    'react/react-in-jsx-scope': 'off',
    'react/jsx-uses-react': 'off',
    'react/jsx-filename-extension': ['warn', { extensions: ['.tsx'] }],
    'import/extensions': 'off',
    'import/no-unresolved': 'off',
    'import/prefer-default-export': 'off',
    'no-restricted-syntax': 'off',
    // 사용자 컨벤션: 모든 함수는 화살표 함수로 정의.
    'func-style': ['error', 'expression'],
    'react/function-component-definition': [
      'error',
      { namedComponents: 'arrow-function', unnamedComponents: 'arrow-function' },
    ],
  },
};
