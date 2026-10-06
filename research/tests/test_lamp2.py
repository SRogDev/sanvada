"""Tests for the LaMP-2 adapter (TDD)."""
import pytest
from collections import Counter

from sanvada_research.lamp2 import (
    assert_disjoint_users,
    global_majority_rank,
    load_history,
    load_queries,
    parse_prompt,
    profile_frequency_rank,
    to_selection_case,
)

PROMPT = (
    "Which tag does this movie relate to among the following tags? "
    "Just answer with the tag name without further explanation. "
    "tags: [sci-fi, comedy, action] description: A movie about space."
)


def test_parse_prompt_extracts_tags_and_description():
    tags, desc = parse_prompt(PROMPT)
    assert tags == ["sci-fi", "comedy", "action"]
    assert desc == "A movie about space."


def test_parse_prompt_rejects_garbage():
    with pytest.raises(ValueError):
        parse_prompt("no tags here")


def test_to_selection_case_bakes_tag_frequency_as_fit():
    history = [("d1", "action"), ("d2", "action"), ("d3", "comedy"), ("d4", "sci-fi")]
    case = to_selection_case("u1", ["sci-fi", "comedy", "action"], "desc", "action", history)
    assert case["user_id"] == "u1"
    assert case["chosen_experience_id"] == "action"
    fits = {c["experience_id"]: c["fit"] for c in case["candidates"]}
    assert fits == {"action": 0.5, "comedy": 0.25, "sci-fi": 0.25}


def test_profile_frequency_rank_picks_most_frequent_tag():
    history = [("d1", "action"), ("d2", "action"), ("d3", "comedy")]
    case = to_selection_case("u1", ["sci-fi", "comedy", "action"], "desc", "action", history)
    ranked = profile_frequency_rank(case)
    assert ranked[0] == "action"


def test_global_majority_rank_ignores_user_history():
    rank = global_majority_rank(Counter({"comedy": 10, "action": 5}))
    case = to_selection_case("u1", ["sci-fi", "comedy", "action"], "desc", "action",
                             [("d", "action")] * 9)
    assert global_majority_rank(Counter({"comedy": 10})) (case)[0] == "comedy"
    assert rank(case)[0] == "comedy"  # global wins over the user's own history


def test_assert_disjoint_users_fails_on_leakage():
    with pytest.raises(ValueError, match="user leakage"):
        assert_disjoint_users({"a", "b"}, {"b", "c"})
    assert_disjoint_users({"a"}, {"b"})  # no raise


def test_load_real_files_shape(tmp_path):
    q = tmp_path / "q.jsonl"
    h = tmp_path / "h.jsonl"
    q.write_text('{"id": "u1", "source": "' + PROMPT.replace('"', '\\"') + '", "target": "action"}\n')
    h.write_text('{"id": "u1", "source": "' + PROMPT.replace('"', '\\"') + '", "target": "comedy"}\n')
    queries = load_queries(q)
    profiles = load_history(h)
    assert queries[0]["target"] == "action"
    assert profiles["u1"][0][1] == "comedy"
