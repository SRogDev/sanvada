
from sanvada_research.prepare import split_by_user


def _ex(eid, user):
    return {"example_id": eid, "user_id": user, "objective": "o",
            "candidates": [], "chosen_experience_id": "x"}


def test_split_by_user_has_zero_overlap():
    exs = [_ex(f"e{i}", f"u{i % 10}") for i in range(100)]
    splits = split_by_user(exs, seed=7)
    users = [{e["user_id"] for e in s} for s in splits.values()]
    assert users[0] & users[1] == set()
    assert users[0] & users[2] == set()
    assert users[1] & users[2] == set()
    assert sum(len(s) for s in splits.values()) == 100


def test_split_by_user_is_deterministic():
    exs = [_ex(f"e{i}", f"u{i % 10}") for i in range(100)]
    a = split_by_user(exs, seed=7)
    b = split_by_user(exs, seed=7)
    assert [e["example_id"] for e in a["test"]] == [e["example_id"] for e in b["test"]]


def test_split_by_user_rejects_missing_user_id():
    import pytest
    with pytest.raises(ValueError, match="lack user_id"):
        split_by_user([{"example_id": "e1"}])
