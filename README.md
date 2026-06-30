# Websears 📄✨

An AI-powered document summarization app that lets you upload documents and generate concise summaries using a choice of NLP models —
from lightweight extractive algorithms to large language models.

## Features

- 📁 **Multi-file uploads** with PDF thumbnail previews (Claude-style attachment UI)
- 🧠 **Multiple summarization models**: BART, T5, LexRank, TextRank, LSA, Luhn, Llama 3.2 (via Ollama), GPT-4o
- 💬 **Conversation history** with continuity across sessions
- 🔗 **Shareable conversation links** via token-based public sharing
- 🌗 **Multi-theme support**
- 🧩 **Chrome extension** with side panel for quick access

## Tech Stack

**Frontend:** React, TypeScript, Vite
**Backend:** Node.js, Express, MySQL (via Sequelize), MongoDB
**Summarization Service:** Python, FastAPI
**AI/ML:** BART, T5, LexRank, TextRank, LSA, Luhn, Ollama (Llama 3.2), GPT-4o

## Project Structure

websears-summary-app/
├── client/           # React + TypeScript frontend
├── server/           # Node.js/Express backend
├── summary_service/  # Python FastAPI summarization microservice
└── .gitignore

## Getting Started

### Prerequisites

- Node.js (v18+)
- Python 3.10+
- MySQL
- MongoDB
- (Optional) [Ollama](https://ollama.com) for local Llama 3.2 inference

### Installation

1. Clone the repository
```bash
   git clone https://github.com/karmokar/websears-summary-app.git
   cd websears-summary-app
```

2. **Frontend setup**
```bash
   cd client
   npm install
   npm run dev
```

3. **Backend setup**
```bash
   cd server
   npm install
   npm start
```

4. **Summarization service setup**
```bash
   cd summary_service
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   pip install -r requirements.txt
   uvicorn main:app --reload
```

5. Configure environment variables (`.env` files) for each service — database URLs, API keys, and model endpoints.

## Usage

1. Start all three services (client, server, summary_service)
2. Open the app in your browser
3. Upload one or more documents (PDF, etc.)
4. Select your preferred summarization model
5. Generate and view your summary
6. Share conversations via a generated link if needed

## Deployment

The app is designed to run on a Linux server with PM2 for process management and Nginx as a reverse proxy.

## Contact

Built by [karmokar](https://github.com/karmokar) and [Tarun](https://github.com/Devil0D)
