# Troubleshooting Assistant

This repository hosts a small demo service that accepts user troubleshooting questions through a POST `/chat` endpoint.

## Environment variables

The server expects an `OPENAI_API_KEY` in its environment. Copy `.env.example` to `.env` and fill in your key:

```
OPENAI_API_KEY=your-openai-api-key
```

## Installation

Install the JavaScript dependencies before running the server:

```bash
npm install
```

## Clarification protocol

The assistant may respond with a `needsClarification` object when it lacks critical system context. The structure of this response is:

```json
{
  "needsClarification": {
    "question": "string"
  }
}
```

`question` contains the clarifying prompt the client must present to the user.

### Client resubmission

When a response contains `needsClarification`, clients must:

1. Present `needsClarification.question` to the user and collect additional information.
2. Resubmit the original message to `/chat` and include the user's answer in the `clarifiedSystem` field of the request body.

### `/chat` request body

```json
{
  "message": "string",
  "clarifiedSystem": "string (optional)"
}
```

`clarifiedSystem` is omitted on the initial request and only supplied after the server asks for clarification.

## Clarification round-trip example

```
POST /chat
{ "message": "My printer won't print." }

→ Response:
{ 
  "needsClarification": { 
    "question": "Which operating system are you using?" 
  } 
}

# Client collects clarification from the user...
# User: "I'm on Windows 11"

POST /chat
{
  "message": "My printer won't print.",
  "clarifiedSystem": "User is on Windows 11."
}

→ Response:
{
  "text": "Try reinstalling the Windows 11 printer driver.",
  "reset": false
}
```

## Development

Run linting for the React frontend and start the Node backend during development:

```bash
cd frontend && npm run lint
```

```bash
node server.js
```

