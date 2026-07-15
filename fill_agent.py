"""Simple LangGraph agent that fills in every BRSR question from the Qdrant vector DB.

Architecture (per question):

    START -> retrieve -> fill -> END

- retrieve: embeds the question text (plus guidance/column labels) and pulls the
  top-K chunks from Qdrant.
- fill: one Gemini call that drafts the answer in the shape the question expects
  (plain value, radio option, or table rows as JSON), strictly from the evidence.

A plain Python loop drives the graph over all questions so you get live progress
output. Results land in filled_report.json.
"""

import json
import sys
from typing import Literal, TypedDict

from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
from langchain_google_genai import ChatGoogleGenerativeAI
from langgraph.graph import StateGraph, START, END

from v_db import client as qdrant_client
from config.constants import COLLECTION_STORE

MODEL = "gemini-2.5-flash"
TOP_K = 8

print("Loading embedding model...", flush=True)
_embedder = SentenceTransformer("BAAI/bge-small-en-v1.5")
_llm = ChatGoogleGenerativeAI(model=MODEL, vertexai=True)


class FilledAnswer(BaseModel):
    status: Literal["answered", "partial", "not_found"]
    answer: str
    missing: str


class State(TypedDict):
    question: dict
    evidence: list[dict]
    result: dict


def _question_text(q: dict) -> str:
    parts = [q["question"]]
    if q.get("guidance"):
        parts.append(q["guidance"])
    if q.get("columns"):
        parts.append("Columns: " + ", ".join(c["label"] for c in q["columns"]))
    if q.get("row_labels"):
        parts.append("Rows: " + ", ".join(q["row_labels"]))
    return "\n".join(parts)


def retrieve(state: State) -> dict:
    q = state["question"]
    vector = _embedder.encode(_question_text(q), normalize_embeddings=True).tolist()
    hits = qdrant_client.query_points(
        collection_name=COLLECTION_STORE, query=vector, limit=TOP_K
    ).points
    evidence = [
        {
            "page": h.payload.get("page"),
            "heading": h.payload.get("Heading", ""),
            "content": h.payload.get("content", ""),
            "score": h.score,
        }
        for h in hits
    ]
    return {"evidence": evidence}


def _answer_format_instruction(q: dict) -> str:
    t = q.get("answer_type", "text")
    if t in ("table_general", "table_dynamic", "matrix"):
        cols = [c["header"] for c in q.get("columns", [])] or [
            r["ref"] for r in q.get("matrix_rows", [])
        ]
        return (
            "Answer must be a JSON array of row objects using these keys: "
            + ", ".join(cols)
            + ". Put it in the 'answer' field as a JSON string. "
            "Use empty string for cells the evidence does not cover."
        )
    if t in ("radio", "multi_select") and q.get("options"):
        return "Answer must be exactly one of: " + ", ".join(q["options"])
    if t == "number":
        return "Answer must be just the number."
    return "Answer concisely with the exact fact(s) requested."


def fill(state: State) -> dict:
    q = state["question"]
    evidence_text = "\n\n".join(
        f"[page {e['page']}] {e['content']}" for e in state["evidence"]
    )

    prompt = (
        f"Question ({q.get('answer_type')}): {q['question']}\n"
        + (f"Guidance: {q['guidance']}\n" if q.get("guidance") else "")
        + f"\n{_answer_format_instruction(q)}\n"
        + f"\nEvidence from the company's BRSR report:\n{evidence_text}"
    )

    result: FilledAnswer = _llm.with_structured_output(FilledAnswer).invoke(
        [
            (
                "system",
                "You fill in BRSR (Business Responsibility and Sustainability "
                "Report) disclosures strictly from the given evidence. Never "
                "invent facts or figures. status='answered' only if the evidence "
                "fully covers the question; 'partial' if some of it is there; "
                "'not_found' if none. Describe anything missing in 'missing'.",
            ),
            ("human", prompt),
        ]
    )

    return {
        "result": {
            "question_id": q["question_id"],
            "section": q.get("section"),
            "question": q["question"],
            "answer_type": q.get("answer_type"),
            "status": result.status,
            "answer": result.answer,
            "missing": result.missing,
            "source_pages": sorted({e["page"] for e in state["evidence"]}),
        }
    }


builder = StateGraph(State)
builder.add_node("retrieve", retrieve)
builder.add_node("fill", fill)
builder.add_edge(START, "retrieve")
builder.add_edge("retrieve", "fill")
builder.add_edge("fill", END)
graph = builder.compile()


def flatten_questions(questions: list[dict]) -> list[dict]:
    """Expand sub_questions into standalone questions."""
    flat = []
    for q in questions:
        flat.append(q)
        for sub in q.get("sub_questions", []):
            flat.append({**sub, "section": q.get("section"), "topic": q.get("topic")})
    return flat


def main(limit: int | None = None):
    with open("BRSR_Questions.json") as f:
        questions = flatten_questions(json.load(f))
    if limit:
        questions = questions[:limit]

    results = []
    for i, q in enumerate(questions, 1):
        out = graph.invoke({"question": q, "evidence": [], "result": {}})
        r = out["result"]
        results.append(r)
        print(f"[{i}/{len(questions)}] {r['question_id']} -> {r['status']}", flush=True)

    with open("filled_report.json", "w") as f:
        json.dump(results, f, indent=2)

    answered = sum(1 for r in results if r["status"] == "answered")
    partial = sum(1 for r in results if r["status"] == "partial")
    not_found = sum(1 for r in results if r["status"] == "not_found")
    print(
        f"\nDone: {answered} answered, {partial} partial, {not_found} not found "
        f"out of {len(results)}. Wrote filled_report.json",
        flush=True,
    )


if __name__ == "__main__":
    limit = int(sys.argv[1]) if len(sys.argv) > 1 else None
    main(limit)
