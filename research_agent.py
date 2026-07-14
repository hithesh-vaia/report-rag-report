"""LangGraph agent that researches BRSR questions against the vector DB.

For each question it generates search queries, retrieves chunks from Qdrant,
judges whether the retrieved evidence is sufficient to answer, and either
refines its queries (up to a retry budget) or synthesizes a final answer.
Questions that never reach sufficient evidence are reported separately.
"""

import json
import operator
from typing import Annotated, Literal, TypedDict

from pydantic import BaseModel, Field
from sentence_transformers import SentenceTransformer
from langchain_google_genai import ChatGoogleGenerativeAI

from v_db import client as qdrant_client
from config.constants import COLLECTION_STORE

from langgraph.graph import StateGraph, START, END

MODEL = "gemini-2.5-flash"
MAX_ITERATIONS = 3
TOP_K = 5

_embedder = SentenceTransformer("BAAI/bge-small-en-v1.5")
_llm = None


def get_llm() -> ChatGoogleGenerativeAI:
    global _llm
    if _llm is None:
        _llm = ChatGoogleGenerativeAI(model=MODEL,vertexai=True)
    return _llm


def embed(text: str):
    return _embedder.encode(text, normalize_embeddings=True).tolist()


class QueriesOutput(BaseModel):
    queries: list[str] = Field(min_length=2, max_length=4)


class AssessmentOutput(BaseModel):
    sufficient: bool
    reason: str


class AnswerOutput(BaseModel):
    answer: str
    fully_supported: bool


class Evidence(TypedDict):
    chunk_index: int
    heading: str
    subheading: str
    page: int
    content: str
    score: float


class QuestionResult(TypedDict):
    question_id: str
    question: str
    sufficient: bool
    answer: str | None
    evidence_pages: list[int]
    reason: str


class AgentState(TypedDict):
    questions: list[dict]
    current: dict | None
    queries: list[str]
    evidence: list[Evidence]
    iterations: int
    results: Annotated[list[QuestionResult], operator.add]
    _assessment: dict


def _llm_structured(system: str, user: str, schema: type[BaseModel]) -> BaseModel:
    structured_llm = get_llm().with_structured_output(schema)
    return structured_llm.invoke(
        [("system", system), ("human", user)]
    )


def next_question(state: AgentState) -> dict:
    if not state["questions"]:
        return {"current": None}
    remaining = list(state["questions"])
    current = remaining.pop(0)
    return {
        "questions": remaining,
        "current": current,
        "queries": [],
        "evidence": [],
        "iterations": 0,
    }


def route_after_next(state: AgentState) -> Literal["generate_queries", "__end__"]:
    return "generate_queries" if state["current"] else END


def generate_queries(state: AgentState) -> dict:
    q = state["current"]
    context_bits = [f"Question: {q['question']}"]
    if q.get("guidance"):
        context_bits.append(f"Guidance: {q['guidance']}")
    if q.get("columns"):
        labels = ", ".join(c["label"] for c in q["columns"])
        context_bits.append(f"Expected data columns: {labels}")
    if q.get("row_labels"):
        context_bits.append(f"Expected rows: {', '.join(q['row_labels'])}")

    prior_note = ""
    if state["evidence"]:
        prior_note = (
            "\nPrevious search returned evidence but it was judged insufficient. "
            "Write more targeted or differently-phrased queries to find the "
            "missing information — don't repeat the same queries."
        )

    result = _llm_structured(
        system=(
            "You generate short full-text search queries to retrieve evidence from a "
            "company's BRSR (Business Responsibility and Sustainability Report) filing, "
            "stored as chunks in a vector database. Generate 2-4 diverse, specific queries "
            "that would surface the exact section answering the question."
            + prior_note
        ),
        user="\n".join(context_bits),
        schema=QueriesOutput,
    )
    return {"queries": result.queries, "iterations": state["iterations"] + 1}


def retrieve(state: AgentState) -> dict:
    seen = {e["chunk_index"] for e in state["evidence"]}
    new_evidence = list(state["evidence"])

    for query in state["queries"]:
        hits = qdrant_client.query_points(
            collection_name=COLLECTION_STORE,
            query=embed(query),
            limit=TOP_K,
        ).points
        for hit in hits:
            payload = hit.payload or {}
            idx = payload.get("chunk_index")
            if idx in seen:
                continue
            seen.add(idx)
            new_evidence.append(
                {
                    "chunk_index": idx,
                    "heading": payload.get("Heading", ""),
                    "subheading": payload.get("Subheading", ""),
                    "page": payload.get("page", 0),
                    "content": payload.get("content", ""),
                    "score": hit.score,
                }
            )

    new_evidence.sort(key=lambda e: e["score"], reverse=True)
    return {"evidence": new_evidence[:20]}


def assess(state: AgentState) -> dict:
    q = state["current"]
    evidence_text = "\n\n".join(
        f"[chunk {e['chunk_index']}, page {e['page']}] {e['heading']} / {e['subheading']}\n{e['content']}"
        for e in state["evidence"]
    ) or "(no evidence retrieved)"

    result = _llm_structured(
        system=(
            "You judge whether retrieved evidence from a BRSR filing is sufficient to "
            "answer a specific disclosure question. Be strict: only mark sufficient if "
            "the evidence actually contains the requested fact or figure, not just a "
            "related topic."
        ),
        user=f"Question: {q['question']}\n\nEvidence:\n{evidence_text}",
        schema=AssessmentOutput,
    )
    return {"_assessment": result.model_dump()}


def route_after_assess(state: AgentState) -> Literal["synthesize", "generate_queries"]:
    assessment = state.get("_assessment", {})
    if assessment.get("sufficient") or state["iterations"] >= MAX_ITERATIONS:
        return "synthesize"
    return "generate_queries"


def synthesize(state: AgentState) -> dict:
    q = state["current"]
    assessment = state.get("_assessment", {})
    sufficient = bool(assessment.get("sufficient"))

    if not state["evidence"]:
        return {
            "results": [
                {
                    "question_id": q["question_id"],
                    "question": q["question"],
                    "sufficient": False,
                    "answer": None,
                    "evidence_pages": [],
                    "reason": "No evidence retrieved from the vector DB.",
                }
            ]
        }

    evidence_text = "\n\n".join(
        f"[page {e['page']}] {e['content']}" for e in state["evidence"]
    )

    result = _llm_structured(
        system=(
            "You draft a BRSR disclosure answer strictly from the given evidence. "
            "If the evidence does not fully support an answer, say what is missing "
            "instead of inventing figures."
        ),
        user=f"Question: {q['question']}\nAnswer type: {q.get('answer_type')}\n\nEvidence:\n{evidence_text}",
        schema=AnswerOutput,
    )

    return {
        "results": [
            {
                "question_id": q["question_id"],
                "question": q["question"],
                "sufficient": sufficient and result.fully_supported,
                "answer": result.answer,
                "evidence_pages": sorted({e["page"] for e in state["evidence"]}),
                "reason": assessment.get("reason", ""),
            }
        ]
    }


builder = StateGraph(AgentState)
builder.add_node("next_question", next_question)
builder.add_node("generate_queries", generate_queries)
builder.add_node("retrieve", retrieve)
builder.add_node("assess", assess)
builder.add_node("synthesize", synthesize)

builder.add_edge(START, "next_question")
builder.add_conditional_edges("next_question", route_after_next, ["generate_queries", END])
builder.add_edge("generate_queries", "retrieve")
builder.add_edge("retrieve", "assess")
builder.add_conditional_edges("assess", route_after_assess, ["synthesize", "generate_queries"])
builder.add_edge("synthesize", "next_question")

graph = builder.compile()


def run(questions: list[dict]) -> list[QuestionResult]:
    final_state = graph.invoke(
        {
            "questions": questions,
            "current": None,
            "queries": [],
            "evidence": [],
            "iterations": 0,
            "results": [],
            "_assessment": {},
        },
        config={"recursion_limit": 200},
    )
    return final_state["results"]


if __name__ == "__main__":
    with open("BRSR_Questions.json") as f:
        all_questions = json.load(f)

    results = run(all_questions)

    fillable = [r for r in results if r["sufficient"]]
    gaps = [r for r in results if not r["sufficient"]]

    print(f"\n{len(fillable)}/{len(results)} questions have sufficient evidence.\n")
    for r in fillable:
        print(f"[OK] {r['question_id']}: {r['question']}")
        print(f"     -> {r['answer']}\n")

    print(f"\n{len(gaps)} questions lack sufficient evidence:")
    for r in gaps:
        print(f"[GAP] {r['question_id']}: {r['question']} — {r['reason']}")

    with open("research_results.json", "w") as f:
        json.dump(results, f, indent=2)
    print("\nWrote research_results.json")
