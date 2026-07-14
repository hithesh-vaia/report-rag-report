import logging

from config.constants import COLLECTION_STORE
from DocChunckSizedecider import DataChunckDecider
from v_db import client

LOG_PATH = "query_terminal.log"

logger = logging.getLogger("query_terminal")
logger.setLevel(logging.INFO)
logger.addHandler(logging.StreamHandler())
logger.addHandler(logging.FileHandler(LOG_PATH))
for handler in logger.handlers:
    handler.setFormatter(logging.Formatter("%(message)s"))


def search(decider, query, limit=5):
    vector = decider.dataEmbedding(query)

    results = client.query_points(
        collection_name=COLLECTION_STORE,
        query=vector,
        limit=limit,
        with_payload=True,
    )

    return results.points


def log_result(rank, point):
    payload = point.payload or {}
    logger.info(
        "\n[%s] score=%.4f chunk_index=%s page=%s",
        rank,
        point.score,
        payload.get("chunk_index"),
        payload.get("page"),
    )
    logger.info("    Heading: %s", payload.get("Heading"))
    logger.info("    Subheading: %s", payload.get("Subheading"))
    content = (payload.get("content") or "")[:400]
    logger.info("    content: %s", content)


def main():
    decider = DataChunckDecider()

    logger.info("Connected to collection '%s'. Type a query, or 'exit' to quit.", COLLECTION_STORE)

    while True:
        try:
            query = input("\nquery> ").strip()
        except (EOFError, KeyboardInterrupt):
            print()
            break

        if not query:
            continue
        if query.lower() in {"exit", "quit"}:
            break

        logger.info("query> %s", query)

        points = search(decider, query)
        if not points:
            logger.info("No results found.")
            continue

        for rank, point in enumerate(points, start=1):
            log_result(rank, point)


if __name__ == "__main__":
    main()
