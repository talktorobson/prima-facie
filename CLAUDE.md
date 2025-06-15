# CLAUDE.md - Prima Facie Project

## Project Overview
Prima Facie is a new TypeScript-based project with a complete development setup including TypeScript, ESLint, Prettier, and Jest for testing.

## Project Structure
```
prima-facie/
├── src/
│   ├── index.ts        # Main entry point
│   ├── services/       # Business logic services
│   ├── types/          # TypeScript type definitions
│   └── utils/          # Utility functions
├── tests/              # Test files
├── docs/               # Documentation
├── dist/               # Compiled JavaScript output (generated)
├── coverage/           # Test coverage reports (generated)
├── .git/               # Git repository
├── node_modules/       # Dependencies (generated)
├── package.json        # Project configuration
├── tsconfig.json       # TypeScript configuration
├── jest.config.js      # Jest testing configuration
├── .eslintrc.json      # ESLint configuration
├── .prettierrc         # Prettier configuration
└── .gitignore          # Git ignore patterns
```

## Available Scripts
- `npm run build` - Compile TypeScript to JavaScript
- `npm run dev` - Run in development mode with ts-node
- `npm start` - Run compiled JavaScript
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage
- `npm run lint` - Check code with ESLint
- `npm run lint:fix` - Auto-fix ESLint issues
- `npm run format` - Format code with Prettier
- `npm run typecheck` - Type check without compiling

## Development Guidelines
- All code uses snake_case naming convention
- TypeScript strict mode is enabled
- ESLint and Prettier are configured for code quality
- Jest is set up for testing

## Version History
- v1.0.0 (2025-06-15): Initial project setup with TypeScript, ESLint, Prettier, and Jest