import re


def clean_llm_json_response(raw: str) -> str:
    cleaned = raw.strip()
    cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
    cleaned = re.sub(r"\s*```$", "", cleaned)
    cleaned = re.sub(r'^"""|"""$', '', cleaned)
    cleaned = cleaned.replace("“", '"').replace(
        "”", '"').replace("‘", "'").replace("’", "'")
    cleaned = re.sub(r",\s*([\]}])", r"\1", cleaned)

    return cleaned


def clean_empty_values(data):
    if isinstance(data, dict):
        return {
            k: clean_empty_values(v)
            for k, v in data.items()
            if v not in [None, "", []] and not (isinstance(v, str) and v.strip() == "")
        }
    elif isinstance(data, list):
        return [
            clean_empty_values(item)
            for item in data
            if item not in [None, "", []] and not (isinstance(item, str) and item.strip() == "")
        ]
    else:
        return data
