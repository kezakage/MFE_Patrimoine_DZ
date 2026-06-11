from rest_framework.pagination import PageNumberPagination


class StandardPagination(PageNumberPagination):
    """Default pagination that lets clients override the page size.

    Keeps the project-wide default of 20 items per page, but admin/list
    views can request more via ``?page_size=`` (capped by ``max_page_size``).
    """

    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 1000
