# React + Vite Project Setup Guide

This guide explains how to install dependencies and run an existing **React + Vite** project locally.

---

## Prerequisites

Before you begin, make sure you have the following installed on your system:

* **Node.js** (version 16+ recommended)

  * Download: [https://nodejs.org](https://nodejs.org)
* **npm** or **yarn** or **pnpm** (comes with Node.js)

To verify installation:

```bash
node -v
npm -v
```

---

## Step 1: Clone the Repository

If you haven’t already cloned the project:

```bash
git clone <repository-url>
cd <project-folder>
```

---

## Step 2: Install Dependencies

Run the following command inside the project folder:

```bash
npm install
```

Or if you use yarn:

```bash
yarn install
```

Or if you use pnpm:

```bash
pnpm install
```

This will install all required packages listed in `package.json`.

---

## Step 3: Start the Development Server

```bash
npm run dev
```

Or with yarn:

```bash
yarn dev
```

Or with pnpm:

```bash
pnpm dev
```

The app will start locally. Open your browser and go to:

```
http://localhost:5173
```

> If port 5173 is already in use, Vite will automatically use another available port and display it in the terminal.

---

## Step 4: Build for Production (Optional)

To create an optimized production build:

```bash
npm run build
```

The output will be generated in the `dist/` folder.

---

## Step 5: Preview the Production Build (Optional)

```bash
npm run preview
```

This starts a local server to preview the production build.

---

## Common Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
```

---

## Troubleshooting

* If `npm install` fails, try deleting `node_modules` and `package-lock.json`, then reinstall:

```bash
rm -rf node_modules package-lock.json
npm install
```

* If dependencies are outdated or broken:

```bash
npm update
```

---

