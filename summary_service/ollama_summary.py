"""
Ollama-based summarization
===========================
Generates a summary using a locally running Ollama model (e.g. llama3.2),
using the system prompt defined in llama_detector.py.
"""

import os
import logging
import requests
from llama_detector import get_system_prompt

logger = logging.getLogger(__name__)

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")


def ollama_summary(text: str, model_name: str = "llama3.2", timeout: int = 120) -> str:
    """
    Generate a summary using a local Ollama model.

    Raises an exception on failure (connection error, timeout, empty response)
    so the caller can decide whether to fall back to another model.
    """
    system_prompt = get_system_prompt(model_name)

    try:
        response = requests.post(
            f"{OLLAMA_URL}/api/generate",
            json={
                "model": model_name,
                "prompt": text,
                "system": system_prompt,
                "stream": False,
            },
            timeout=timeout,
        )
        response.raise_for_status()
        data = response.json()
        summary = data.get("response", "").strip()

        if not summary:
            raise ValueError("Ollama returned an empty response")

        logger.info(f"[Ollama] Generated summary: {len(summary.split())} words")
        return summary

    except requests.exceptions.ConnectionError:
        raise RuntimeError(
            f"Cannot connect to Ollama at {OLLAMA_URL}. Is 'ollama serve' running?"
        )
    except requests.exceptions.Timeout:
        raise RuntimeError(f"Ollama request timed out after {timeout}s")
    except Exception as e:
        logger.error(f"[Ollama] Summarization failed: {e}")
        raise