import os

from dotenv import load_dotenv
from qdrant_client import QdrantClient

load_dotenv()
from config.constants import QDRANT_API_KEY, URL_V_DB

client = QdrantClient(
    url=URL_V_DB,
    api_key=QDRANT_API_KEY,
)
