"""Pagination helpers."""

def paginate(total: int, page: int, page_size: int) -> dict:
    pages = max(1, (total + page_size - 1) // page_size)
    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": pages,
    }
