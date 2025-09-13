# AI Texture Editor

This is an advanced, AI-powered image and texture editing application built with React, TypeScript, and Vite. It uses the Google Gemini API to perform powerful image manipulations.

## Project Structure

This project follows a standard Vite + React structure. All application source code is located in the `src` directory.

-   `src/components`: Reusable React components.
-   `src/services`: Modules for interacting with APIs (like Gemini).
-   `src/main.tsx`: The main entry point of the application.
-   `api/`: Serverless functions for backend logic (like proxying API calls).
-   `public/`: Static assets that are copied directly to the build output.
-   `dist/`: The production build output folder (generated after running `npm run build`).

## Setup and Installation

Before you can run the project, you need to install its dependencies. Make sure you have [Node.js](https://nodejs.org/) installed on your machine.

Open your terminal in the project's root directory and run:

```bash
npm install
```

This will download and install all the necessary packages defined in `package.json`.

## Running the Development Server

To run the application on your local machine for development and testing, use the following command:

```bash
npm run dev
```

This will start a fast development server (usually on `http://localhost:5173`). The server will automatically reload the page whenever you make changes to the code.

**Important:** You must use this command to view the app locally. Do not open the `index.html` file directly in your browser. Modern web apps require a build process (or a dev server that simulates it) to transpile code (like TypeScript/JSX) into plain JavaScript that browsers can understand and to bundle all the modules together. The dev server handles this for you in real-time.

## Building for Production

When you are ready to deploy your website to a live server, you need to create an optimized production build. Run this command:

```bash
npm run build
```

This will compile all the project files into a `dist` folder. This folder contains the small, optimized static files (HTML, CSS, JavaScript) that are ready to be deployed. You should upload the **contents of the `dist` folder** to your hosting provider.

## Deployment

This project is configured for easy deployment on modern hosting platforms like [Vercel](https://vercel.com) or [Netlify](https://www.netlify.com/).

**Key Step for Deployment:** You must set an environment variable in your hosting provider's settings:

-   **Name:** `API_KEY`
-   **Value:** Your secret Google Gemini API key.

This ensures your API key is kept safe on the server and is not exposed to users in the browser.