# AI Code Explainer

AI Code Explainer is a small, responsive coding tool. Explain a pasted JavaScript snippet with a structured walkthrough, describe a coding task to generate an implementation, or translate source code between supported languages.

## Features

- Three explanation levels: Beginner, Intermediate, and Advanced
- Discount, grouping, and retry examples to explore immediately
- Structured Markdown explanations with readable code blocks
- Copy code and copy explanation actions, plus a clear/reset action
- Character and line count, input validation, loading state, and useful error messages
- Responsive dark developer-tool interface with keyboard-accessible controls
- Submitted code is treated as text and is never executed by the app
- Code explanations, code generation, and translation use NVIDIA's hosted API
- Generate code from natural-language requests, with a formatted output block and copy/clear actions
- Translate code between JavaScript, TypeScript, Python, Java, C++, C#, Go, PHP, and SQL, with syntax-highlighted output

## Technologies

- HTML5, CSS3, and vanilla JavaScript
- Node.js 18.18 or later
- Express for the local web server and API endpoint
- NVIDIA API, called from the server with `fetch`; the API key stays server-side
- Highlight.js for local generated/translated-code syntax highlighting
- `dotenv` for loading local environment settings

## Project structure

```text
ai-code-explainer/
├── backend/
│   ├── server.js        # Static server and shared NVIDIA API proxy for all features
│   ├── package.json     # Backend dependencies and commands
│   ├── package-lock.json
│   └── .env.example     # Environment variable template (no secret)
├── public/
│   ├── index.html   # Application UI
│   ├── style.css    # Responsive styles
│   └── script.js    # Browser interactions and safe Markdown display
├── .gitignore       # Excludes secrets and installed packages
└── README.md
```

## Install

1. Install Node.js 18.18 or later.
2. Open a terminal in the `backend` directory.
3. Install the backend dependencies:

   ```sh
   npm install
   ```

## Configure NVIDIA AI

1. Create an API key in NVIDIA Build at <https://build.nvidia.com/>.
2. In the `backend` directory, copy `.env.example` to `.env` if you do not already have a `.env` file. If you already have one, add or update `NVIDIA_API_KEY` and `NVIDIA_MODEL`:

```env
NVIDIA_API_KEY=your-nvidia-api-key
NVIDIA_MODEL=minimaxai/minimax-m3.1-flash
NVIDIA_TEMPERATURE=0.3
NVIDIA_TOP_P=0.9
NVIDIA_MAX_TOKENS=4096
PORT=3003
```

Choose a model that is available to your NVIDIA API key and set its model ID as `NVIDIA_MODEL`. Keep `.env` out of Git; `.gitignore` already excludes it. `NVIDIA_MAX_TOKENS` limits generated output for each feature. Settings outside their supported ranges use the defaults.

## Run locally

Start the app from the `backend` directory:

```sh
npm start
```

Open <http://localhost:3003>. During development, `npm run dev` restarts the server when files change. Run `npm run check` to check JavaScript syntax.

Use the Express server URL above rather than opening `index.html` directly or using a static-only preview such as Live Server. The browser needs the Express API endpoints to process AI requests.

## Deploy on Render

Create a Render Web Service for the repository with the repository root as its root directory. Set the build command to `npm ci --prefix backend` and the start command to `node backend/server.js`. Add `NVIDIA_API_KEY` in the Render environment settings, and set `NVIDIA_MODEL` to a model available to that key. Render provides `PORT` automatically.

## How it works

1. The browser sends JavaScript code and its explanation level to `POST /api/explain`, a natural-language coding request to `POST /api/generate`, or code plus source/target languages to `POST /api/translate`.
2. The server validates the request and sends a concise feature-specific prompt to NVIDIA's streaming chat-completions API.
3. NVIDIA's server-sent events are converted to NDJSON and forwarded to the browser as they arrive. Output is rendered incrementally; generated and translated code is syntax-highlighted after completion.
4. Each request logs its start time, response duration, and token counts when NVIDIA includes usage in its response.

The explanation prompt asks for purpose, key logic, likely bugs, a small input/output example, and useful improvements, adapted to the selected level. All prompts treat supplied code or requests as untrusted text.

The code generator requests a clean implementation and code-only output without Markdown fences or surrounding prose. The translator asks NVIDIA AI to preserve functionality and return only code. Generated and translated code is highlighted locally with Highlight.js; both panels support streaming multiline output and copy/clear actions.

## Security notes

- Prompts and submitted code are sent to NVIDIA's hosted API for processing.
- Keep `NVIDIA_API_KEY` private. Configure it in Render's environment settings for deployment; never put it in frontend code or commit it to Git.
- Keep `.env` out of version control; `.gitignore` excludes it.
- Submitted code is bounded in size, handled as text, and never evaluated or executed.
- Model explanations are rendered through safe DOM APIs rather than trusted as HTML.
- Do not commit or share `.env`; rotate a key if it is accidentally exposed.
- For a public deployment, add authentication, request rate limits, HTTPS, and usage monitoring before exposing the endpoint.

## Possible future improvements

- Support additional AI providers through a server-side provider setting
- Add per-request cancellation and saved explanations
- Add syntax highlighting in the editor and displayed code blocks
- Add tests for API validation, Markdown rendering, and provider failures
- Add authentication and rate limiting for hosted deployments