import json
import logging
import time
import ollama
from src.config import SYSTEM_PROMPT, build_pii_prompt
from src.preprocessor import clean_llm_json_response, clean_empty_values

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)


class OllamaClient:
    def __init__(self, model: str = "llama3.2:latest"):
        self.model = model
        self.messages = []
        self.update_chat("system", SYSTEM_PROMPT)
        self.update_chat("system", build_pii_prompt())

    def update_chat(self, role: str, content: str):
        """Append a message to the conversation history."""
        self.messages.append({"role": role, "content": content})

    def prompt_model(self) -> str:
        """Send the chat to the model and return the response string."""
        logger.debug("Sending prompt to model...")
        response = ollama.chat(model=self.model, messages=self.messages)
        return response['message']['content']

    def get_structured_data(self, content: str, max_retries: int = 5, delay: int = 2) -> dict | None:
        """Attempt to retrieve and parse structured JSON data from LLM."""
        self.update_chat("user", content)

        for attempt in range(1, max_retries + 1):
            logger.info(f"Attempt {attempt}: Getting structured data...")

            raw_output = self.prompt_model().strip()
            cleaned_output = clean_llm_json_response(raw_output)

            try:
                parsed_data = json.loads(cleaned_output)
                parsed_data = clean_empty_values(parsed_data)
                logger.info("Successfully parsed JSON.")
                return parsed_data

            except json.JSONDecodeError as e:
                logger.warning(f"JSON decoding failed: {e}")
                logger.debug(f"Raw LLM output:\n{cleaned_output}")

                feedback = (
                    "The previous response was not valid JSON. "
                    f"Error: {e}"
                    f"Here is the invalid response:\n{cleaned_output}"
                    "Please return only valid JSON with double quotes and proper syntax."
                )
                self.update_chat("user", feedback)

                if attempt < max_retries:
                    time.sleep(delay)
                else:
                    logger.error(
                        "Max retries reached. Failed to get valid JSON.")
                    return None
