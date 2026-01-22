# React + Vite Project Setup Guide

This guide walks you through setting up a modern React project using **Vite**. Vite is a fast build tool that provides an excellent developer experience with instant server start and hot module replacement (HMR).

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

## Step 1: Create a New Vite + React Project

Run the following command in your terminal:

```bash
npm create vite@latest
```

You will be prompted with a few questions:

* **Project name:** your-project-name
* **Select a framework:** React
* **Select a variant:** JavaScript or TypeScript (choose based on your preference)

Example:

```bash
npm create vite@latest my-react-app
```

---

## Step 2: Navigate into the Project Folder

```bash
cd my-react-app
```

---

## Step 3: Install Dependencies

```bash
npm install
```

Or if you use yarn:

```bash
yarn
```

---

## Step 4: Start the Development Server

```bash
npm run dev
```

This will start the Vite dev server. Open your browser and go to:

```
http://localhost:5173
```

You should see the default Vite + React welcome page.

---

## Project Structure Overview

After setup, your project will look like this:

```
my-react-app/
├─ public/
│  └─ vite.svg
├─ src/
│  ├─ assets/
│  ├─ App.jsx
│  ├─ main.jsx
│  └─ index.css
├─ index.html
├─ package.json
├─ vite.config.js
└─ README.md
```

Key files:

* **main.jsx** – Entry point of the app
* **App.jsx** – Main React component
* **index.html** – Root HTML file
* **vite.config.js** – Vite configuration

---

## Adding Tailwind CSS (Optional)

If you want to use Tailwind CSS:

```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

Update `tailwind.config.js`:

```js
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

Add to `src/index.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

---

## Building for Production

To create a production build:

```bash
npm run build
```

The output will be in the `dist/` folder.

---

## Preview Production Build Locally

```bash
npm run preview
```

---

## Useful Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
```

---

## Troubleshooting

* If `npm create vite@latest` fails, update npm:

```bash
npm install -g npm
```

* If port 5173 is busy, Vite will automatically use another port.

---

## Resources

* Vite Docs: [https://vitejs.dev](https://vitejs.dev)
* React Docs: [https://react.dev](https://react.dev)

---

Happy coding 🚀
