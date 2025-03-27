# Pom0 - React + Electron App with shadcn/ui

A desktop application built with React, Electron, and shadcn/ui components.

## Features

- React for UI development
- Electron for cross-platform desktop capabilities
- shadcn/ui for beautiful, accessible components
- TailwindCSS for utility-first styling
- Vite for fast development and building

## Development

### Prerequisites

- Node.js (v16+)
- npm (v7+)

### Getting Started

1. Install dependencies:

```bash
npm install
```

2. Run the development server:

```bash
npm run electron:dev
```

This will start the Vite development server and launch the Electron app.

### Building for Production

```bash
npm run electron:build
```

This will create distributable packages in the `release` folder.

## Project Structure

```
pom0/
├── electron/             # Electron-specific code
│   ├── main.cjs          # Main Electron process
│   └── preload.cjs       # Preload script
├── src/                  # React application code
│   ├── components/       # React components
│   │   └── ui/           # shadcn/ui components
│   ├── lib/              # Utility functions
│   ├── App.tsx           # Main React component
│   └── main.tsx          # React entry point
└── package.json          # Project configuration
```

## License

MIT
