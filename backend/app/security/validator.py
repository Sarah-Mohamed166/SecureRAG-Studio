import string


class QueryValidator:
    """
    Validates incoming user queries before retrieval.
    """

    MAX_QUERY_LENGTH = 1000

    @staticmethod
    def validate(query: str) -> tuple[bool, str]:
        """
        Returns:
            (True, "") if valid
            (False, error_message) if invalid
        """

        # None check
        if query is None:
            return False, "Query cannot be empty."

        # Remove surrounding whitespace
        query = query.strip()

        # Empty query
        if not query:
            return False, "Query cannot be empty."

        # Maximum length
        if len(query) > QueryValidator.MAX_QUERY_LENGTH:
            return (
                False,
                f"Query exceeds the maximum length of {QueryValidator.MAX_QUERY_LENGTH} characters.",
            )

        # Query made only of punctuation
        if all(char in string.punctuation for char in query):
            return (
                False,
                "Query contains no meaningful text.",
            )

        return True, ""