# GEMINI.md: Project Context

This document provides essential context for the "Daily Log" project, a simple React chat application.

## Project Overview

The "Daily Log" is a web-based chat application designed for two users, "Meet" and "Khushi", to maintain a shared daily log. It's built with React, TypeScript, and Vite. The application leverages Supabase for real-time database operations and Netlify Functions for serverless API calls. Access is protected by password authentication.

A key feature is its integration with the Google Gemini API, which provides:
1.  **Audio Transcription:** Users can record voice notes, which are transcribed into text.
2.  **AI-Powered Reflections:** After sending a message, the application analyzes the text and generates a "reflection" containing a mood analysis, an acknowledgement, and encouragement.

The application includes password-protected access with cookie-based authentication to ensure privacy for the shared daily log.

The UI is styled using utility-first CSS classes, likely from a framework like Tailwind CSS, and includes a theming system allowing users to customize their interface colors.

## Building and Running

The project is configured to run with Node.js and npm.

1.  **Install Dependencies:**
    ```bash
    npm install
    ```

2.  **Set Up Environment Variables:**
    Create a `.env.local` file in the project root and add your API keys:
    ```
    VITE_GEMINI_API_KEY=your_gemini_api_key_here
    VITE_SUPABASE_URL=your_supabase_url_here
    VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
    VITE_APP_PASSWORD=your_app_password_here
    ```

3.  **Run the Development Server:**
    This command starts the Vite development server, typically on `http://localhost:3000`.
    ```bash
    npm run dev
    ```

4.  **Build for Production:**
    This command bundles the application for deployment.
    ```bash
    npm run build
    ```

5.  **Preview Production Build:**
    This command serves the production build locally.
    ```bash
    npm run preview
    ```

## Development Conventions

*   **Frameworks & Libraries:**
    *   **UI:** React 19 with TypeScript
    *   **Build Tool:** Vite
    *   **Database:** Supabase
    *   **Serverless Functions:** Netlify Functions
    *   **AI:** `@google/genai` for Gemini API integration

*   **Project Structure:**
    *   `src/`: This project does not use a `src` directory. Main files like `App.tsx` and `index.tsx` are in the root.
    *   `components/`: Contains reusable React components including PasswordAuth for authentication.
    *   `services/`: Houses modules for external services (Supabase, API, Gemini).
    *   `types.ts`: Defines shared TypeScript types and interfaces.
    *   `themes.ts`: Contains the theming configuration for the UI.

*   **Coding Style:**
    *   The codebase uses functional components with React Hooks (`useState`, `useEffect`).
    *   Asynchronous operations are handled with `async/await`.
    *   Supabase real-time subscriptions are used for data synchronization.

*   **Configuration:**
    *   **Vite:** `vite.config.ts` is configured to proxy environment variables to the frontend.
    *   **TypeScript:** `tsconfig.json` is set up for a modern React project.
    *   **Netlify:** `netlify.toml` configures the build and functions deployment.
    *   **Supabase:** Environment variables for Supabase URL and anonymous key are required.
