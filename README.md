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
- Code explanations run locally through Ollama without a cloud API key
- Generate code from natural-language requests, with a formatted output block and copy/clear actions
- Translate code between JavaScript, TypeScript, Python, Java, C++, C#, Go, PHP, and SQL, with syntax-highlighted output

## Technologies

- HTML5, CSS3, and vanilla JavaScript
- Node.js 18.18 or later
- Express for the local web server and API endpoint
- Ollama local API, called from the server with `fetch`
- Highlight.js for local generated/translated-code syntax highlighting
- `dotenv` for loading local environment settings

## Project structure

```text
ai-code-explainer/
├── backend/
│   ├── server.js        # Static server and shared Ollama proxy for all features
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

## Configure Ollama

Install Ollama for Windows from <https://ollama.com/download/windows>, then download the lightweight model. This command works even when Ollama is not on PATH:

```powershell
& "$env:LOCALAPPDATA\Programs\Ollama\ollama.exe" pull qwen2.5-coder:1.5b
```

In the `backend` directory, create a local `.env` file by copying `.env.example`:

```env
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=qwen2.5-coder:1.5b
OLLAMA_TEMPERATURE=0.3
OLLAMA_TOP_P=0.9
OLLAMA_NUM_PREDICT=500
OLLAMA_NUM_CTX=4096
OLLAMA_KEEP_ALIVE=10m
PORT=3003
```

Start Ollama before starting this app. `.env` is ignored by Git. Set `OLLAMA_MODEL` to another model installed in Ollama if desired. The 1.5B model uses less memory and is generally faster on CPU-only computers. `OLLAMA_NUM_PREDICT` limits generated tokens for every feature; raise it if longer explanations or code are being cut off. Settings outside their supported ranges use the defaults.

## Run locally

Start the app from the `backend` directory:

```sh
npm start
```

Open <http://localhost:3003>. During development, `npm run dev` restarts the server when files change. Run `npm run check` to check JavaScript syntax.

Use the Express server URL above rather than opening `index.html` directly or using a static-only preview such as Live Server. The browser needs the Express API endpoints to process AI requests.

## How it works

1. The browser sends JavaScript code and its explanation level to `POST /api/explain`, a natural-language coding request to `POST /api/generate`, or code plus source/target languages to `POST /api/translate`.
2. The server validates the request and sends a concise feature-specific prompt through one shared streaming Ollama API helper.
3. Ollama NDJSON chunks are forwarded to the browser as they arrive. Output is rendered incrementally; generated and translated code is syntax-highlighted after completion. The browser also accepts the previous JSON response format from an already-running server process; restart the Node app to enable streaming and load server-side setting changes.
4. Each request logs its start time, response duration, and prompt/output token counts. A `keep_alive` setting retains the model in Ollama between requests, and Node's shared fetch dispatcher reuses HTTP connections.

The explanation prompt asks for purpose, key logic, likely bugs, a small input/output example, and useful improvements, adapted to the selected level. All prompts treat supplied code or requests as untrusted text.

The code generator requests a clean implementation and code-only output without Markdown fences or surrounding prose. The translator asks Ollama to preserve functionality and return only code. Generated and translated code is highlighted locally with Highlight.js; both panels support streaming multiline output and copy/clear actions.

## Security notes

- No cloud API key is required; prompts are sent to the local Ollama service.
- Keep `.env` out of version control; `.gitignore` excludes it.
- Submitted code is bounded in size, handled as text, and never evaluated or executed.
- Model explanations are rendered through safe DOM APIs rather than trusted as HTML.
- Do not commit or share `.env`; rotate a key if it is accidentally exposed.
- For a public deployment, add authentication, request rate limits, HTTPS, and usage monitoring before exposing the endpoint.

## Possible future improvements

- Support additional providers through a server-side provider setting
- Add per-request cancellation and saved explanations
- Add syntax highlighting in the editor and displayed code blocks
- Add tests for API validation, Markdown rendering, and provider failures
- Add authentication and rate limiting for hosted deployments


for starting OLLAMA
ollama serve

for stopping OLLAMA
Stop-Process -Name ollama -Force

for cheaking it is running or not
curl.exe http://localhost:11434/api/tags