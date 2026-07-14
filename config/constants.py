import os

from dotenv import load_dotenv

load_dotenv()


URL_V_DB = os.getenv("URL_V_DB")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY")
COLLECTION_STORE:str|None = os.getenv("COLLECTION_STORE")
MODEL:str|None= os.getenv("gemini-2.5-flash")
