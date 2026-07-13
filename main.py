from qdrant_client.models import Distance, VectorParams

from DocChunckSizedecider import DataChunckDecider
from v_db import client

if not client.collection_exists("BRSR_REPORT_STORE"):
    client.create_collection(
        collection_name="BRSR_REPORT_STORE",
        vectors_config=VectorParams(size=384, distance=Distance.COSINE),
    )


pipline = DataChunckDecider()

pipline.start_pipeline()

#now we have extracted details from the pdf and now we will be using ai Agents for completing
#
#
