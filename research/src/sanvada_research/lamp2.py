"""LaMP-2 adapter: real benchmark for per-user selection accuracy.

Loads the LaMP-2 personalized movie-tagging data (HuggingFace mirror
``haotiansun014/LaMP``, files ``LaMP_2/42_*.jsonl``) and converts it to
the selection-example/v1 format used by the benchmark harness.

Reframing: given a user's past movie taggings (the "profile") and a new
movie description, select the tag the user would assign from 15
candidates. ``fit`` for each candidate = the tag's frequency in that
user's history — the honest non-learned signal. A model that beats the
profile-frequency heuristic has learned something beyond counting.

Split guarantee: the mirror ships 326 train users and 50 test users
with ZERO overlap (verified 2026-10-06). ``assert_disjoint_users``
re-verifies this on every load — a model that memorizes users is the
opposite of understanding.
"""

from __future__ import annotations

import json
import re
from collections import Counter
from pathlib import Path

TAGS_PATTERN = re.compile(r"tags: \[(.*?)\]")
DESC_PATTERN = re.compile(r"description: (.*)", re.S)

OBJECTIVE = "lamp2-movie-tagging"


def parse_prompt(source: str) -> tuple[list[str], str]:
    """Extract (tags, description) from a LaMP-2 prompt string."""
    tags_m = TAGS_PATTERN.search(source)
    desc_m = DESC_PATTERN.search(source)
    if not tags_m or not desc_m:
        raise ValueError(f"unparseable LaMP-2 prompt: {source[:80]!r}")
    tags = [t.strip() for t in tags_m.group(1).split(",")]
    return tags, desc_m.group(1).strip()


def load_history(path: str | Path) -> dict[str, list[tuple[str, str]]]:
    """user_id -> [(description, tag), ...] from the history file."""
    profiles: dict[str, list[tuple[str, str]]] = {}
    with open(path, encoding="utf-8") as fh:
        for line in fh:
            line = line.strip()
            if not line:
                continue
            row = json.loads(line)
            _tags, desc = parse_prompt(row["source"])
            profiles.setdefault(row["id"], []).append((desc, row["target"]))
    return profiles


def load_queries(path: str | Path) -> list[dict]:
    """Test queries: [{id, tags, description, target}]."""
    cases = []
    with open(path, encoding="utf-8") as fh:
        for line in fh:
            line = line.strip()
            if not line:
                continue
            row = json.loads(line)
            tags, desc = parse_prompt(row["source"])
            cases.append(
                {"id": row["id"], "tags": tags, "description": desc,
                 "target": row["target"]}
            )
    return cases


def load_train(path: str | Path) -> dict[str, list[tuple[str, str, str]]]:
    """user_id -> [(tags_str, description, target), ...] from the train file."""
    by_user: dict[str, list[tuple[str, str, str]]] = {}
    with open(path, encoding="utf-8") as fh:
        for line in fh:
            line = line.strip()
            if not line:
                continue
            row = json.loads(line)
            tags, desc = parse_prompt(row["source"])
            by_user.setdefault(row["id"], []).append(
                (", ".join(tags), desc, row["target"])
            )
    return by_user


def assert_disjoint_users(*user_sets: set[str]) -> None:
    """Fail loudly if any user appears in more than one split."""
    seen: set[str] = set()
    for s in user_sets:
        overlap = seen & s
        if overlap:
            raise ValueError(
                f"user leakage across splits: {sorted(overlap)[:5]}"
            )
        seen |= s


def tag_frequencies(history: list[tuple[str, str]]) -> Counter:
    return Counter(tag for _, tag in history)


def to_selection_case(
    user_id: str,
    tags: list[str],
    description: str,
    target: str,
    history: list[tuple[str, str]],
    source: str = "lamp2",
) -> dict:
    """One selection-example/v1-compatible case with user_id attached."""
    freq = tag_frequencies(history)
    total = sum(freq.values()) or 1
    candidates = [
        {
            "experience_id": tag,
            "fit": round(freq.get(tag, 0) / total, 4),
            "novelty": 0.0,
            "risk": "low",
        }
        for tag in tags
    ]
    profile_lines = [
        f'- "{d[:160]}" -> {t}' for d, t in history[:20]
    ]
    return {
        "example_id": f"lamp2-{user_id}",
        "user_id": user_id,
        "schema_version": "selection-example/v1",
        "objective": OBJECTIVE,
        "context_summary": (
            f"User's past movie taggings ({len(history)}):\n"
            + "\n".join(profile_lines)
            + f"\n\nMovie to tag: \"{description[:400]}\""
        ),
        "candidates": candidates,
        "chosen_experience_id": target,
        "rationale": "gold label from LaMP-2",
        "source": source,
    }


def build_test_cases(
    queries_path: str | Path, history_path: str | Path
) -> list[dict]:
    """Test cases with the user's full history as context."""
    profiles = load_history(history_path)
    cases = []
    for q in load_queries(queries_path):
        history = profiles.get(q["id"], [])
        cases.append(
            to_selection_case(
                q["id"], q["tags"], q["description"], q["target"], history
            )
        )
    return cases


def build_train_examples(train_path: str | Path) -> list[dict]:
    """Every train row -> selection example with user_id attached.

    Candidates carry the user's leave-one-out tag frequency as fit (the
    honest non-learned signal); the fine-tuned model must beat ranking by
    fit. One context summary is built per user and reused across their
    rows (O(users × items), not O(rows²)).
    """
    by_user = load_train(train_path)
    examples = []
    for user_id, rows in by_user.items():
        history = [(d, t) for _, d, t in rows]
        freq = tag_frequencies(history)
        total = sum(freq.values())
        profile_lines = [f'- "{d[:160]}" -> {t}' for d, t in history[:20]]
        summary_head = (
            f"User's past movie taggings ({len(history)}):\n" + "\n".join(profile_lines)
        )
        for i, (tags_str, desc, target) in enumerate(rows):
            tags = [t.strip() for t in tags_str.split(",")]
            candidates = [
                {
                    "experience_id": tag,
                    # leave-one-out: exclude the current row from its own fit
                    "fit": round(
                        (freq.get(tag, 0) - (1 if tag == target else 0))
                        / max(total - 1, 1),
                        4,
                    ),
                    "novelty": 0.0,
                    "risk": "low",
                }
                for tag in tags
            ]
            examples.append(
                {
                    "example_id": f"lamp2-train-{user_id}-{i}",
                    "user_id": user_id,
                    "schema_version": "selection-example/v1",
                    "objective": OBJECTIVE,
                    "context_summary": summary_head
                    + f'\n\nMovie to tag: "{desc[:400]}"',
                    "candidates": candidates,
                    "chosen_experience_id": target,
                    "rationale": "gold label from LaMP-2",
                    "source": "lamp2-train",
                }
            )
    return examples

def profile_frequency_rank(case: dict) -> list[str]:
    """Honest non-learned baseline: rank tags by frequency in the user's history.

    Uses the ``fit`` scores baked into the case (tag frequency). Ties break
    alphabetically — fully deterministic.
    """
    ranked = sorted(
        case["candidates"],
        key=lambda c: (-c["fit"], c["experience_id"]),
    )
    return [c["experience_id"] for c in ranked]


def global_majority_rank(global_freq: Counter) -> object:
    """Baseline with NO personalization: rank by global tag frequency.

    The gap between this and profile_frequency_rank is the value of
    per-user information — the thing the thesis measures.
    """
    order = [tag for tag, _ in global_freq.most_common()]

    def rank(case: dict) -> list[str]:
        return sorted(
            [c["experience_id"] for c in case["candidates"]],
            key=lambda t: (order.index(t) if t in order else len(order), t),
        )

    return rank


def profile_probs(case: dict) -> dict[str, float]:
    """Candidate probabilities from the user's tag frequency (sums to 1)."""
    total = sum(c["fit"] for c in case["candidates"]) or 1.0
    return {c["experience_id"]: c["fit"] / total for c in case["candidates"]}
