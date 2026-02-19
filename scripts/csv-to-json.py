#!/usr/bin/env python3
"""
CSV-to-JSON conversion script for BJB Litigation Process Flowcharts.
Reads CSV exports from the Google Sheets spreadsheet and produces
JSON files matching the SectionData interface.
"""

import csv
import json
import re
import os
import sys

# ── Colour palette keyed by Quick Action Panel value ──────────────────────

COLOR_MAP = {
    # Case Opening
    "Client Orientation":                "#1565c0",
    "Case Setup":                        "#1a237e",
    "Automated Doc Request":             "#2e7d32",
    "Doc Request":                       "#e65100",
    "Review":                            "#6a1b9a",
    "Doc Production":                    "#e65100",
    "Approval":                          "#6a1b9a",
    "Filing":                            "#c62828",
    "Service of Summons & Complaint":    "#00838f",
    "Court Notice":                      "#37474f",
    "Follow Up":                         "#f9a825",
    "Supportive Doc Production":         "#ad1457",
    "Court Filing Notice":               "#37474f",

    # Treatment Monitoring
    "Treatment Monitoring or Client Communication":              "#00695c",
    "Treatment Monitoring or Client Communication Appointment":  "#00695c",
    "Liens Audit":                       "#4e342e",
    "Updated medical bills":             "#e65100",
    "Amending Discovery Responses":      "#0d47a1",
    "Supportive Administrative Taks":    "#546e7a",

    # Discovery
    "Discovery":                         "#0d47a1",
    "Client Discovery Appt":             "#0d47a1",
    "Management Escalation":             "#c62828",
    "Discovery Appointment":             "#0d47a1",

    # Expert & Deposition
    "Assign non party deposition procedure": "#37474f",
    "Retaining Expert":                  "#4e342e",
    "Expert Report Review":              "#4e342e",
    "Amended Expert Report":             "#4e342e",
    "Amended Expert Report Review":      "#4e342e",
    "Client Deposition":                 "#00838f",
    "System Automation":                 "#2e7d32",

    # Arbitration / Mediation
    "Client Notice":                     "#37474f",
    "Case Prep":                         "#5d4037",
    "Court Filing":                      "#c62828",
    "Calendar":                          "#546e7a",
    "Automation":                        "#546e7a",
    "Preparartion":                      "#5d4037",
    "Preparation":                       "#5d4037",
    "Documentation":                     "#0d47a1",
}

# Section-level theme colours (primary colour for the header)
THEME_COLORS = {
    "case-opening":           "#1a237e",
    "treatment-monitoring":   "#00695c",
    "discovery":              "#0d47a1",
    "expert-deposition":      "#4e342e",
    "arbitration-mediation":  "#5d4037",
}


def slugify(text: str) -> str:
    """Convert a Quick Action Panel value to a CSS-safe slug."""
    s = text.strip().lower()
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return s.strip("-")


def make_style_key(qa: str) -> str:
    """Convert Quick Action Panel value to a style key."""
    return slugify(qa)


def id_from_index(i: int) -> str:
    """Generate a letter-based ID: A, B, … Z, AA, AB, …"""
    result = ""
    n = i
    while True:
        result = chr(ord("A") + n % 26) + result
        n = n // 26 - 1
        if n < 0:
            break
    return result


def lighten(hex_color: str, amount: float = 0.85) -> str:
    """Return a lightened version of hex_color for node fill."""
    hex_color = hex_color.lstrip("#")
    r, g, b = int(hex_color[0:2], 16), int(hex_color[2:4], 16), int(hex_color[4:6], 16)
    r = int(r + (255 - r) * amount)
    g = int(g + (255 - g) * amount)
    b = int(b + (255 - b) * amount)
    return f"#{r:02x}{g:02x}{b:02x}"


def truncate_notes(text: str, max_len: int = 500) -> str:
    """Truncate long objective text for notes field."""
    text = text.strip()
    if len(text) <= max_len:
        return text
    return text[:max_len].rsplit(" ", 1)[0] + "..."


def is_banner_row(row: list) -> bool:
    """Check if a row is a section banner (has text in col B but no assignee/task)."""
    if len(row) < 4:
        return False
    qa = row[1].strip() if len(row) > 1 else ""
    assigned = row[2].strip() if len(row) > 2 else ""
    task = row[3].strip() if len(row) > 3 else ""
    return bool(qa) and not assigned and not task


def is_task_row(row: list) -> bool:
    """Check if a row contains actual task data."""
    if len(row) < 4:
        return False
    assigned = row[2].strip() if len(row) > 2 else ""
    task = row[3].strip() if len(row) > 3 else ""
    return bool(assigned) and bool(task)


def parse_csv(filepath: str):
    """Parse a CSV file and return (title, task_rows, banner_rows)."""
    with open(filepath, "r", encoding="utf-8-sig") as f:
        reader = csv.reader(f)
        rows = list(reader)

    if not rows:
        return None, [], []

    # Row 0 = title row (col B has the title)
    title = rows[0][1].strip() if len(rows[0]) > 1 else ""
    # Remove "BJB: " or "BJB: LIT / " prefix for cleaner titles
    title = re.sub(r"^BJB:\s*(LIT\s*/\s*)?", "", title).strip()

    # Row 1 = header row — skip
    # Rows 2+ = data
    task_rows = []
    banner_rows = []

    for i, row in enumerate(rows[2:], start=2):
        if is_task_row(row):
            task_rows.append((i, row))
        elif is_banner_row(row):
            banner_rows.append((i, row))

    return title, task_rows, banner_rows


def build_section(csv_path: str, section_id: str):
    """Build a complete SectionData JSON object from a CSV file."""
    title, task_rows, banner_rows = parse_csv(csv_path)
    if title is None or not task_rows:
        return None

    theme_color = THEME_COLORS.get(section_id, "#1a237e")
    tasks = []
    seen_qa = {}  # Quick Action Panel → order of first appearance
    legend_items = []
    styles_map = {}

    for idx, (row_num, row) in enumerate(task_rows):
        qa = row[1].strip() if len(row) > 1 else ""
        assigned = row[2].strip() if len(row) > 2 else ""
        task_name = row[3].strip() if len(row) > 3 else ""
        objective = row[4].strip() if len(row) > 4 else ""
        function_val = row[5].strip() if len(row) > 5 else ""
        sla = row[6].strip() if len(row) > 6 else ""

        # Clean up multiline task names — keep only the first line for label
        task_label = task_name.split("\n")[0].strip()
        # If the task name itself is very long, truncate
        if len(task_label) > 120:
            task_label = task_label[:117] + "..."

        # Get colour for this QA value
        color = COLOR_MAP.get(qa, "#607d8b")
        style_key = make_style_key(qa) if qa else "default"

        # Track legend
        if qa and qa not in seen_qa:
            seen_qa[qa] = len(seen_qa)
            legend_items.append({"label": qa, "color": color})
            styles_map[style_key] = {
                "fill": lighten(color, 0.85),
                "stroke": color,
                "color": "#222",
            }

        # Build phase from QA
        phase = qa if qa else "General"
        phase_class = f"phase-{slugify(qa)}" if qa else "phase-general"

        # Notes from objective — truncate very long text
        notes = truncate_notes(objective) if objective else ""
        # If the task name contained multiline content, append it to notes
        if "\n" in task_name and len(task_name) > len(task_label):
            extra = task_name[len(task_label):].strip()
            if extra:
                notes = (truncate_notes(extra, 300) + "\n\n" + notes).strip() if notes else truncate_notes(extra, 300)

        task_id = id_from_index(idx)

        task_obj = {
            "id": task_id,
            "label": task_label,
            "assignedTo": assigned,
            "sla": sla,
            "phase": phase,
            "phaseClass": phase_class,
            "quickAction": qa,
            "style": style_key,
            "connectsTo": [],
            "function": function_val if function_val else None,
            "notes": notes if notes else None,
        }

        if idx == 0:
            task_obj["isStartNode"] = True

        tasks.append(task_obj)

    # ── Build connectsTo edges ──────────────────────────────
    # Strategy: sequential flow by default. Special cases:
    # - "Back to Intake" / "Send Cut Letter" = terminal (no outgoing)
    # - Call attempt chains connect sequentially
    # - System automations that fire in parallel fan out from the prior task

    terminal_patterns = [
        r"back to intake",
        r"send cut letter",
    ]

    for i, task in enumerate(tasks):
        label_lower = task["label"].lower()

        # Check if terminal
        is_terminal = any(re.search(p, label_lower) for p in terminal_patterns)
        if is_terminal:
            task["connectsTo"] = []
            continue

        # Default: connect to next task
        if i < len(tasks) - 1:
            task["connectsTo"] = [tasks[i + 1]["id"]]
        else:
            task["connectsTo"] = []

    # Remove None values from task objects for cleaner JSON
    clean_tasks = []
    for t in tasks:
        clean = {k: v for k, v in t.items() if v is not None}
        if "connectsTo" not in clean:
            clean["connectsTo"] = []
        clean_tasks.append(clean)

    # Build subtitle
    first_qa = legend_items[0]["label"] if legend_items else ""
    last_qa = legend_items[-1]["label"] if legend_items else ""
    subtitle = f"{len(tasks)} tasks"
    if first_qa and last_qa and first_qa != last_qa:
        subtitle += f" — {first_qa} through {last_qa}"
    elif first_qa:
        subtitle += f" — {first_qa}"

    section = {
        "id": section_id,
        "title": title,
        "subtitle": subtitle,
        "headerClass": "",
        "themeColor": theme_color,
        "thClass": "",
        "sectionClass": "",
        "tableColumns": ["#", "Phase", "Quick Action Panel", "Assigned To", "Task", "SLA"],
        "legend": legend_items,
        "tasks": clean_tasks,
        "styles": styles_map,
    }

    return section


def main():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    csv_dir = os.path.join(base_dir, "tmp-csv")
    data_dir = os.path.join(base_dir, "data")
    public_data_dir = os.path.join(base_dir, "public", "data")

    os.makedirs(data_dir, exist_ok=True)
    os.makedirs(public_data_dir, exist_ok=True)

    files = [
        ("case-opening.csv",          "case-opening"),
        ("treatment-monitoring.csv",   "treatment-monitoring"),
        ("discovery.csv",              "discovery"),
        ("expert-deposition.csv",      "expert-deposition"),
        ("arbitration-mediation.csv",  "arbitration-mediation"),
    ]

    for csv_name, section_id in files:
        csv_path = os.path.join(csv_dir, csv_name)
        if not os.path.exists(csv_path):
            print(f"  SKIP  {csv_name} (not found)")
            continue

        section = build_section(csv_path, section_id)
        if section is None:
            print(f"  SKIP  {csv_name} (empty or no tasks)")
            continue

        out_path = os.path.join(data_dir, f"{section_id}.json")
        public_out_path = os.path.join(public_data_dir, f"{section_id}.json")
        json_str = json.dumps(section, indent=2, ensure_ascii=False)
        for path in (out_path, public_out_path):
            with open(path, "w", encoding="utf-8") as f:
                f.write(json_str)

        print(f"  OK    {section_id}.json  ({len(section['tasks'])} tasks, {len(section['legend'])} phases)")

    print("\nDone.")


if __name__ == "__main__":
    main()
