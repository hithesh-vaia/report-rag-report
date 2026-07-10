import json
import os
import re

import pdfplumber

PDF_PATH = "brsrtata.pdf"
OUTPUT_PATH = "brsr_sections.json"

SECTION_RE = re.compile(r"^SECTION\s+[A-Z]\s*:")
SUBHEADING_RE = re.compile(r"^([IVXLC]+\.\s|PRINCIPLE\s+\d+\s*:)", re.IGNORECASE)
NUMBERED_ITEM_RE = re.compile(r"^\d+\.\s|^[a-z]\.\s")


def group_lines(words, y_tol=3):
    """Group words on the same page into lines based on vertical position."""
    lines = []
    current_line = []
    current_top = None

    for word in words:
        if current_top is None or abs(word["top"] - current_top) <= y_tol:
            current_line.append(word)
            current_top = word["top"] if current_top is None else current_top
        else:
            lines.append(current_line)
            current_line = [word]
            current_top = word["top"]

    if current_line:
        lines.append(current_line)

    return lines


def line_text(line):
    return " ".join(w["text"] for w in line).strip()


def is_bold_line(line):
    return all("bold" in w["fontname"].lower() for w in line)


KNOWN_SUBHEADINGS = {"essential indicators", "leadership indicators"}


def classify_line(text, bold):
    if SECTION_RE.match(text):
        return "heading"
    if SUBHEADING_RE.match(text):
        return "subheading"
    if text.lower() in KNOWN_SUBHEADINGS:
        return "subheading"
    if (
        bold
        and 2 <= len(text.split()) <= 8
        and not NUMBERED_ITEM_RE.match(text)
        and text[0].isupper()
        and text.istitle()
    ):
        return "subheading"
    return "text"


def word_in_any_table(word, table_bboxes):
    cx = (word["x0"] + word["x1"]) / 2
    cy = (word["top"] + word["bottom"]) / 2
    for x0, top, x1, bottom in table_bboxes:
        if x0 <= cx <= x1 and top <= cy <= bottom:
            return True
    return False


def pdf_extractor(pdf_path=PDF_PATH):
    """Extract a PDF into an array of {Heading, Subheading, content, page, pdf_title} dicts."""
    document = []
    current_heading = ""
    current_subheading = ""
    paragraph = []

    def flush_paragraph():
        if paragraph and document:
            document[-1]["content"].append(" ".join(paragraph))
            paragraph.clear()

    with pdfplumber.open(pdf_path) as pdf:
        pdf_title = (pdf.metadata or {}).get("Title") or os.path.splitext(
            os.path.basename(pdf_path)
        )[0]

        for page_no, page in enumerate(pdf.pages, start=1):
            words = page.extract_words(
                use_text_flow=True,
                keep_blank_chars=True,
                extra_attrs=["fontname", "size"],
            )
            table_bboxes = [t.bbox for t in page.find_tables()]
            words = [w for w in words if not word_in_any_table(w, table_bboxes)]
            lines = group_lines(words)
            tables = page.extract_tables()

            for line in lines:
                text = line_text(line)
                if not text:
                    continue

                line_type = classify_line(text, is_bold_line(line))

                if line_type == "heading":
                    flush_paragraph()
                    current_heading = text
                    current_subheading = ""
                    document.append(
                        {
                            "Heading": current_heading,
                            "Subheading": current_subheading,
                            "content": [],
                            "page": page_no,
                            "pdf_title": pdf_title,
                        }
                    )

                elif line_type == "subheading":
                    flush_paragraph()
                    current_subheading = text
                    document.append(
                        {
                            "Heading": current_heading,
                            "Subheading": current_subheading,
                            "content": [],
                            "page": page_no,
                            "pdf_title": pdf_title,
                        }
                    )

                else:
                    paragraph.append(text)

            flush_paragraph()

            for table in tables:
                if document:
                    rows = [
                        " | ".join(cell or "" for cell in row) for row in table if row
                    ]
                    document[-1]["content"].append("\n".join(rows))

    # Collapse content into a single string per section, keeping schema to
    # exactly {Heading, Subheading, content}
    for chunk_index, section in enumerate(document):
        section["content"] = "\n".join(section["content"])
        section["chunk_index"] = chunk_index

    return document


if __name__ == "__main__":
    result = pdf_extractor()
    with open(OUTPUT_PATH, "w") as f:
        json.dump(result, f, indent=2)
    print(f"Wrote {len(result)} sections to {OUTPUT_PATH}")
