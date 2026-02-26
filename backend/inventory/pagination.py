from rest_framework.pagination import PageNumberPagination


class FlexiblePageNumberPagination(PageNumberPagination):
    """
    Extends the default paginator to honour a `page_size` query parameter.
    Callers can request up to 10 000 items in a single page.
    """
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 10000
