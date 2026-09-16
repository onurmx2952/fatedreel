"""Conservative pause handling; never require a small LLM to approve speech.

Speech recognition punctuation is ignored. Only obvious unfinished endings
or explicit requests for thinking time keep a turn open. This is a heuristic,
not a semantic or acoustic end-of-turn model.
"""
import re


def needs_more_speech(text):
    text = re.sub(r"[^\w\s']", ' ', text.lower())
    text = ' '.join(text.split())
    if not text:
        return True
    thinking = r"(?:let me think(?: about (?:it|that))?|i(?:'m| am) thinking|give me (?:a|one) (?:moment|second|minute)|hold on|wait(?: a (?:second|minute))?|bir dakika(?: düşünüyorum)?|düşünüyorum|biraz düşüneyim|bekle)"
    if re.search(r'(?:^|\s)' + thinking + r'$', text):
        return True
    # These endings need a continuation. Do not reject greetings, short
    # answers, or complete questions merely because they are short.
    return bool(re.search(
        r"(?:\b(?:and|because|but|or|to|the|a|an)|"
        r"\b(?:my name is|i would like|i want|i need|i am going to|"
        r"benim adım|çünkü|ve|ama))$", text))
