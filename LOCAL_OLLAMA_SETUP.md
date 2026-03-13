# Local Ollama Setup

This machine has been configured with Ollama and a working local model.

## Installed components

- Ollama version: `0.17.7`
- Installed model: `gemma3:1b`
- Ollama executable used in this session: `C:\Users\ahmeds\AppData\Local\Programs\Ollama\ollama.exe`
- Local API endpoint: `http://localhost:11434`

## Successful commands

These commands were run successfully on this machine.

### 1. Install Ollama

```powershell
winget install -e --id Ollama.Ollama
```

### 2. Check the installed version

```powershell
& 'C:\Users\ahmeds\AppData\Local\Programs\Ollama\ollama.exe' --version
```

### 3. Download a local model

```powershell
& 'C:\Users\ahmeds\AppData\Local\Programs\Ollama\ollama.exe' pull gemma3:1b
```

### 4. List installed models

```powershell
& 'C:\Users\ahmeds\AppData\Local\Programs\Ollama\ollama.exe' list
```

### 5. Test the local HTTP API

```powershell
Invoke-RestMethod -Method Post -Uri 'http://localhost:11434/api/generate' -ContentType 'application/json' -Body '{"model":"gemma3:1b","prompt":"Reply with exactly: local model OK","stream":false}' | Select-Object model,response,done
```

Expected result:

- `model` = `gemma3:1b`
- `response` starts with `local model OK`
- `done` = `True`

## After restarting PowerShell

The `ollama` command may work directly after a new shell is opened:

```powershell
ollama --version
ollama list
ollama run gemma3:1b
```

If not, keep using the full executable path shown above.

## Connect a tool/editor to the local model

Use these values in any editor or extension that supports a custom LLM endpoint:

- Base URL: `http://localhost:11434`
- Model: `gemma3:1b`

If the tool asks for an OpenAI-compatible base URL, try:

- `http://localhost:11434/v1`

## Recommended usage pattern

- Use `gemma3:1b` for quick summaries, drafting, and simple code help.
- Keep Claude for harder reasoning and larger-context tasks.
- If you want better local coding quality later, pull a larger model when you confirm your machine can handle it.
