

from v_db import client as qdrant_client
from config.constants import COLLECTION_STORE
from DocChunckSizedecider import DataChunckDecider

class AiAgents:
    """These are the ai agents, used to query the llm as well as retrive the content selection"""


    def __init__(
            self,
        ):
            """loading encoder model"""
            print("Loading the embedding  model")
            self.model = DataChunckDecider()
            print("Loaded model")
            print("Initialized data pipeline")
            self.data = []

    def search(self,query,embedding_model=None):
        """Here you will have the input of all the models which you require """
        print(f"Searching fro query {query}\n",query)

        vector=self.model.dataEmbedding(query)


        results = qdrant_client.query_points(
            collection_name=COLLECTION_STORE,
            query=vector,
            limit=5,
            with_payload=True,
        )
        return results.points
