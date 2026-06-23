import math
import warnings
from sumy.parsers.plaintext import PlaintextParser
from sumy.nlp.tokenizers import Tokenizer
from sumy.summarizers.lex_rank import LexRankSummarizer

# Suppress annoying warnings
warnings.filterwarnings("ignore")


def extractive_summary(text: str) -> str:
    # 1. Catch empty inputs immediately
    if not text or not text.strip():
        return "No content to summarize."

    try:
        # 2. Let Sumy parse the text FIRST to get a highly accurate sentence count
        parser = PlaintextParser.from_string(text, Tokenizer("english"))
        total_sentences = len(parser.document.sentences)

        # 3. Too short? Return full text
        if total_sentences <= 3:
            return text.strip()

        # 4. Decide number of sentences dynamically
        min_len = math.ceil(total_sentences / 3)  # at least 1/3
        max_len = math.ceil(total_sentences / 2)  # at most half

        # Use middle point, but ensure it never drops below 1
        num_sentences = max(1, (min_len + max_len) // 2)

        # 5. Generate the summary
        summarizer = LexRankSummarizer()
        summary = summarizer(parser.document, num_sentences)

        return " ".join([str(sentence) for sentence in summary])

    except Exception as e:
        print(f"[LexRank] Error during summarization: {e}")
        # 6. Graceful Fallback: If Sumy fails, safely return the first chunk of text
        fallback_sentences = text.replace("?", ".").replace("!", ".").split(". ")
        keep = max(1, len(fallback_sentences) // 2)
        return ". ".join(fallback_sentences[:keep]).strip() + "."
