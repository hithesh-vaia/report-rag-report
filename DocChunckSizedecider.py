from qdrant_client.models import Distance, Document, PointStruct, VectorParams
from sentence_transformers import SentenceTransformer

from pdf_pipeline import pdf_extractor
from v_db import client


class DataChunckDecider:
    "🫠"

    def __init__(
        self,
    ):
        print("Loading the model")
        self.model = SentenceTransformer("BAAI/bge-small-en-v1.5")
        print("Loaded model")
        print("Initialized data pipeline")
        self.data = []

        print("Extracted the pdf and  the data")

    def start_pipeline(self):
        """Starting pipeline"""
        print("Starting pipeline")
        self.data = pdf_extractor()
        print("loaded layouts and data of the pdf")
        print("")
        final_cleaned = []

        for b, a in enumerate(self.data):
            vec_t = self.dataEmbedding(a["content"])
            payload = {**a}
            payload["content"] = payload["content"][:65]

            final_cleaned.append(
                {"vector": vec_t, "payload": {**a, "content": a["content"][:65]}}
            )
        print("DATA to upsert VDB, is ready, Quadrant let us gooo")
        self.upsertingPipeline(final_cleaned)
        print("Boom almost done")

        print(final_cleaned[0])

    def dataEmbedding(
        self,
        text,
    ):
        """embedding 😄"""

        embeding = self.model.encode(text, normalize_embeddings=True)

        return embeding

    def upsertingVDB(self, points):
        """puting things on the top"""

        client.upsert(
            collection_name="BRSR_REPORT_STORE",
            points=points,
        )

        print("This is really happening")

    def upsertingPipeline(self, final_cleaned):
        """Upserting it to the DB"""
        points = []
        for i, item in enumerate(final_cleaned):
            points.append(
                PointStruct(
                    id=i,
                    vector=item["vector"].tolist(),
                    payload=item["payload"],
                )
            )

        self.upsertingVDB(points)
