# UML Architect

An Electron desktop application that connects to the OpenAI API to transform natural-language prompts into high-level UML architecture diagrams. The renderer uses Mermaid to visualise the generated UML and also exposes the raw Mermaid markup for further editing.

## Features

- Prompt-driven UML generation powered by OpenAI chat completions
- Configurable model (defaults to `gpt-4o-mini`; override with `OPENAI_MODEL`)
- Mermaid-based live diagram preview with copy-to-clipboard helper
- Isolated renderer via Electron preload plus IPC bridge
- TypeScript main process with strict type checking

## Prerequisites

- Node.js 18 or newer (Electron 29 targets the Node 18 runtime)
- An OpenAI API key with access to the chosen model

## Getting Started

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set environment variables**
   # PowerShell
   $Env:OPENAI_API_KEY="sk-..."

   # optional: choose a different model
   $Env:OPENAI_MODEL="gpt-4.1"
   ```

   Alternatively, place these values in a local `.env` file and source it before launching the app.

3. **Build and run the Electron app**
   ```bash
   npm start
   ```

   The `start` script compiles the TypeScript sources, copies the static renderer assets into `dist/renderer`, and launches Electron.

## Project Structure

```
project/
|-- package.json
|-- tsconfig.json
|-- scripts/
|   `-- copy-static.js      # copies HTML/CSS/JS assets into dist before launch
|-- src/
|   `-- main/
|       |-- main.ts          # Electron bootstrap plus IPC wiring
|       |-- preload.ts       # secure renderer bridge exposing generateUml
|       `-- openaiService.ts # chat completion call and response parsing
`-- static/
    |-- index.html          # renderer shell (loads Mermaid and UI)
    |-- renderer.js         # renderer logic making IPC requests
    `-- styles.css          # UI styling
```

## How It Works

1. The renderer posts the user's natural-language requirement via `window.api.generateUml`.
2. The preload script forwards the call to the main process through IPC.
3. `openaiService.ts` sends the prompt to the OpenAI Chat Completions API and enforces a JSON-only response (diagram metadata plus Mermaid code).
4. The renderer receives the response, renders the Mermaid markup into an SVG preview, and exposes the raw code for reuse.

## Customisation Ideas

- Swap Mermaid for PlantUML or Kroki rendering if you prefer external services.
- Persist generated diagrams locally, for example export to PNG, SVG, or Markdown.
- Add prompt templates or system guidance tuning for different architecture levels.
- Integrate additional panes such as sequence diagrams or C4 models.

## Troubleshooting

- `Missing OPENAI_API_KEY environment variable` - ensure the key is exported before running `npm start`.
- Mermaid rendering errors - the model might output invalid Mermaid syntax; tweak the prompt or provide corrective context.
- OpenAI API rate or usage errors - inspect the Electron DevTools console or terminal logs for the raw API error payload.

## License

MIT
