
from langchain_google_genai import ChatGoogleGenerativeAI
from config.constants import MODEL
DEFAULT_CONFIG = {"thinking_budget": 0}
from typing import Any

def get_chat_model(**overrides: Any) -> ChatGoogleGenerativeAI:
    """
    Create a Gemini chat model with configurable parameters.

    Example:
        get_chat_model()

        get_chat_model(
            temperature=0.8,
            model="gemini-2.5-pro",
        )

        get_chat_model(
            thinking_budget=2048,
            max_output_tokens=4096,
        )
    """


    config = {
        **DEFAULT_CONFIG,
        "model": MODEL,
        **overrides,
    }


    return ChatGoogleGenerativeAI(**config, vertexai=True)
