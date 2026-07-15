"""Convert filled_report.json (fill_agent output) into rows for the `responses` table.

Maps each agent answer onto the seed script's format:
  - question_ref   <- `framework` from BRSR_Questions.json (brsr-a-001 -> BRSR_A_Q1)
  - value_number   <- number answers
  - value_text     <- text / small_text / radio answers
  - value_json     <- tables as {"rows":[{"id","label","cells"}]}, matrix as
                      {rowRef: {P1..P9: value}}, multi_select as JSON array

Usage:
  python convert_to_seed.py                          # writes seed_rows.json
  python convert_to_seed.py --account X --holding-id Y --year 2023
  python convert_to_seed.py --skip-not-found
"""

import argparse
import json
import re
import uuid

PRINCIPLES = ["P1", "P2", "P3", "P4", "P5", "P6", "P7", "P8", "P9"]


def load_question_index() -> dict:
    """question_id -> question definition (sub_questions flattened in)."""
    with open("BRSR_Questions.json") as f:
        questions = json.load(f)
    index = {}
    for q in questions:
        index[q["question_id"]] = q
        for sub in q.get("sub_questions", []):
            index[sub["question_id"]] = sub
    return index


def mkrow(label, cells):
    row = {"id": str(uuid.uuid4()), "cells": cells}
    if label is not None:
        row["label"] = label
    return row


def parse_table_answer(answer: str) -> list[dict] | None:
    answer = answer.strip()
    if not answer:
        return []
    try:
        parsed = json.loads(answer)
    except json.JSONDecodeError:
        return None
    if isinstance(parsed, dict):
        parsed = [parsed]
    if not isinstance(parsed, list):
        return None
    return [r for r in parsed if isinstance(r, dict)]


def convert_table(qdef: dict, answer: str):
    rows = parse_table_answer(answer)
    if rows is None:
        return None
    labels = qdef.get("row_labels", [])
    out = []
    for i, cells in enumerate(rows):
        label = labels[i] if i < len(labels) else None
        out.append(mkrow(label, cells))
    return json.dumps({"rows": out})


def convert_matrix(qdef: dict, answer: str):
    """Agent emits one row object per principle; seed wants {rowRef: {P: value}}."""
    rows = parse_table_answer(answer)
    if rows is None:
        return None
    refs = [r["ref"] for r in qdef.get("matrix_rows", [])]
    if not refs:  # matrix without matrix_rows — fall back to table shape
        return convert_table(qdef, answer)
    result = {ref: {} for ref in refs}
    for i, row in enumerate(rows):
        principle = PRINCIPLES[i] if i < len(PRINCIPLES) else f"P{i + 1}"
        for ref in refs:
            if ref in row:
                result[ref][principle] = row[ref]
    return json.dumps(result)


def convert_multi_select(qdef: dict, answer: str):
    options = qdef.get("options", [])
    exact = [opt for opt in options if opt.lower() == answer.strip().lower()]
    if exact:
        return json.dumps(exact)
    selected = [opt for opt in options if opt.lower() in answer.lower()]
    if not selected and answer.strip():
        selected = [s.strip() for s in re.split(r"[,;&/]| and ", answer) if s.strip()]
    return json.dumps(selected)


def convert_number(answer: str):
    cleaned = answer.replace(",", "").strip()
    match = re.search(r"-?\d+(?:\.\d+)?", cleaned)
    return float(match.group()) if match else None


def convert(account: str, holding_id: str, year: int, skip_not_found: bool) -> list:
    qindex = load_question_index()
    with open("filled_report.json") as f:
        results = json.load(f)

    rows, skipped = [], []
    for r in results:
        qdef = qindex.get(r["question_id"])
        if qdef is None or not qdef.get("framework"):
            skipped.append((r["question_id"], "no framework ref"))
            continue
        if skip_not_found and r["status"] == "not_found":
            skipped.append((r["question_id"], "not_found"))
            continue

        answer = r.get("answer") or ""
        answer_type = r.get("answer_type") or "text"
        value_number = value_text = value_json = None

        if answer_type in ("table_general", "table_dynamic"):
            value_json = convert_table(qdef, answer)
            if value_json is None:
                value_text = answer  # unparseable — keep raw so nothing is lost
        elif answer_type == "matrix":
            value_json = convert_matrix(qdef, answer)
            if value_json is None:
                value_text = answer
        elif answer_type == "multi_select":
            value_json = convert_multi_select(qdef, answer)
        elif answer_type == "number":
            value_number = convert_number(answer)
            if value_number is None and answer.strip():
                value_text = answer
        else:  # text, small_text, radio
            value_text = answer if answer.strip() else None

        if value_number is None and value_text is None and value_json is None:
            skipped.append((r["question_id"], "empty answer"))
            continue

        rows.append({
            "id": str(uuid.uuid4()),
            "account": account,
            "holding_id": holding_id,
            "question_ref": qdef["framework"],
            "period_year": year,
            "period_month": None,
            "value_number": value_number,
            "value_text": value_text,
            "value_json": value_json,
        })

    return rows, skipped


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--account", default="ACCOUNT_PLACEHOLDER")
    parser.add_argument("--holding-id", default="HOLDING_PLACEHOLDER", dest="holding_id")
    parser.add_argument("--year", type=int, default=2023)  # Tata Investment report is FY 2022-23
    parser.add_argument("--skip-not-found", action="store_true")
    parser.add_argument("--out", default="seed_rows.json")
    args = parser.parse_args()

    rows, skipped = convert(args.account, args.holding_id, args.year, args.skip_not_found)

    with open(args.out, "w") as f:
        json.dump(rows, f, indent=2)

    print(f"Wrote {len(rows)} seed rows to {args.out}")
    if skipped:
        print(f"Skipped {len(skipped)}:")
        for qid, why in skipped:
            print(f"  - {qid}: {why}")
