
from sanvada_research.train import build_training_text, RESPONSE_TEMPLATE


def test_build_training_text_appends_exact_response():
    ex = {"instruction": "### Instruction\nPick one.\n### Response", "response": "exp-42"}
    text = build_training_text(ex)
    assert text.endswith("### Response\nexp-42")
    assert text.count("### Response") == 1


def test_response_template_matches_prepare_format():
    # prepare.to_instruction ends the instruction with "### Response" (no newline);
    # the collator keys on "### Response\n" — the join must produce exactly that.
    from sanvada_research.prepare import to_instruction
    inst = to_instruction({
        "objective": "o", "context_summary": "c",
        "candidates": [{"experience_id": "a", "fit": 0.5, "novelty": 0.5, "risk": "low"}],
        "chosen_experience_id": "a",
    })
    text = build_training_text(inst)
    assert "### Response\n" in text
    assert text.split("### Response\n")[1] == "a"
