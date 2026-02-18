"""
Django Filter configurations for Inventory App

Defines filter classes for API endpoints using django-filter.
"""

import django_filters
from .models import PokemonSet, Card, InventoryItem, StreamEvent, StreamInventory


class PokemonSetFilter(django_filters.FilterSet):
    """
    Filter for PokemonSet model.
    Allows filtering by name, series, and release date range.
    """
    
    name = django_filters.CharFilter(
        lookup_expr='icontains',
        help_text="Filter by set name (case-insensitive, partial match)"
    )
    series = django_filters.CharFilter(
        lookup_expr='icontains',
        help_text="Filter by series name (case-insensitive, partial match)"
    )
    set_code = django_filters.CharFilter(
        lookup_expr='iexact',
        help_text="Filter by exact set code (case-insensitive)"
    )
    release_date_after = django_filters.DateFilter(
        field_name='release_date',
        lookup_expr='gte',
        help_text="Filter sets released on or after this date"
    )
    release_date_before = django_filters.DateFilter(
        field_name='release_date',
        lookup_expr='lte',
        help_text="Filter sets released on or before this date"
    )
    
    class Meta:
        model = PokemonSet
        fields = ['name', 'series', 'set_code', 'release_date_after', 'release_date_before']


class CardFilter(django_filters.FilterSet):
    """
    Filter for Card model.
    Allows filtering by name, set, rarity, and card type.
    """
    
    name = django_filters.CharFilter(
        lookup_expr='icontains',
        help_text="Filter by card name (case-insensitive, partial match)"
    )
    pokemon_set = django_filters.NumberFilter(
        help_text="Filter by pokemon set ID"
    )
    set_code = django_filters.CharFilter(
        field_name='pokemon_set__set_code',
        lookup_expr='iexact',
        help_text="Filter by set code (case-insensitive)"
    )
    rarity = django_filters.ChoiceFilter(
        choices=Card.Rarity.choices,
        help_text="Filter by card rarity"
    )
    card_type = django_filters.ChoiceFilter(
        choices=Card.CardType.choices,
        help_text="Filter by card type"
    )
    # Multiple rarity filter
    rarity_in = django_filters.MultipleChoiceFilter(
        field_name='rarity',
        choices=Card.Rarity.choices,
        help_text="Filter by multiple rarities (comma-separated)"
    )
    
    class Meta:
        model = Card
        fields = ['name', 'pokemon_set', 'set_code', 'rarity', 'card_type', 'rarity_in']


class InventoryItemFilter(django_filters.FilterSet):
    """
    Filter for InventoryItem model.
    Allows filtering by card, condition, quantity, and price range.
    """
    
    card = django_filters.NumberFilter(
        help_text="Filter by card ID"
    )
    deck = django_filters.NumberFilter(
        help_text="Filter by deck ID"
    )
    card_name = django_filters.CharFilter(
        field_name='card__name',
        lookup_expr='icontains',
        help_text="Filter by card name (case-insensitive, partial match)"
    )
    set_code = django_filters.CharFilter(
        field_name='card__pokemon_set__set_code',
        lookup_expr='iexact',
        help_text="Filter by set code"
    )
    condition = django_filters.ChoiceFilter(
        choices=InventoryItem.Condition.choices,
        help_text="Filter by condition"
    )
    condition_in = django_filters.MultipleChoiceFilter(
        field_name='condition',
        choices=InventoryItem.Condition.choices,
        help_text="Filter by multiple conditions"
    )
    prestige = django_filters.ChoiceFilter(
        choices=InventoryItem.Prestige.choices,
        help_text="Filter by prestige level"
    )
    min_quantity = django_filters.NumberFilter(
        field_name='quantity',
        lookup_expr='gte',
        help_text="Minimum quantity"
    )
    max_quantity = django_filters.NumberFilter(
        field_name='quantity',
        lookup_expr='lte',
        help_text="Maximum quantity"
    )
    min_price = django_filters.NumberFilter(
        field_name='current_price',
        lookup_expr='gte',
        help_text="Minimum current price"
    )
    max_price = django_filters.NumberFilter(
        field_name='current_price',
        lookup_expr='lte',
        help_text="Maximum current price"
    )
    location = django_filters.CharFilter(
        lookup_expr='icontains',
        help_text="Filter by storage location"
    )
    sku = django_filters.CharFilter(
        lookup_expr='iexact',
        help_text="Filter by exact SKU"
    )
    in_stock = django_filters.BooleanFilter(
        method='filter_in_stock',
        help_text="Filter for items with quantity > 0"
    )
    
    class Meta:
        model = InventoryItem
        fields = [
            'card', 'deck', 'card_name', 'set_code', 'condition', 'condition_in',
            'min_quantity', 'max_quantity', 'min_price', 'max_price',
            'location', 'sku', 'in_stock', 'prestige'
        ]
    
    def filter_in_stock(self, queryset, name, value):
        """Filter for items in stock or out of stock."""
        if value is True:
            return queryset.filter(quantity__gt=0)
        elif value is False:
            return queryset.filter(quantity=0)
        return queryset


class StreamEventFilter(django_filters.FilterSet):
    """
    Filter for StreamEvent model.
    Allows filtering by title, platform, and date range.
    """
    
    title = django_filters.CharFilter(
        lookup_expr='icontains',
        help_text="Filter by stream title"
    )
    platform = django_filters.ChoiceFilter(
        choices=StreamEvent.Platform.choices,
        help_text="Filter by platform"
    )
    stream_date_after = django_filters.DateTimeFilter(
        field_name='stream_date',
        lookup_expr='gte',
        help_text="Filter streams on or after this date"
    )
    stream_date_before = django_filters.DateTimeFilter(
        field_name='stream_date',
        lookup_expr='lte',
        help_text="Filter streams on or before this date"
    )
    
    class Meta:
        model = StreamEvent
        fields = ['title', 'platform', 'stream_date_after', 'stream_date_before']


class StreamInventoryFilter(django_filters.FilterSet):
    """
    Filter for StreamInventory model.
    Allows filtering by stream event, inventory item, and featured status.
    """
    
    stream_event = django_filters.NumberFilter(
        help_text="Filter by stream event ID"
    )
    inventory_item = django_filters.NumberFilter(
        help_text="Filter by inventory item ID"
    )
    featured = django_filters.BooleanFilter(
        help_text="Filter by featured status"
    )
    has_sales = django_filters.BooleanFilter(
        method='filter_has_sales',
        help_text="Filter for items with quantity_sold > 0"
    )
    
    class Meta:
        model = StreamInventory
        fields = ['stream_event', 'inventory_item', 'featured', 'has_sales']
    
    def filter_has_sales(self, queryset, name, value):
        """Filter for items that had sales."""
        if value is True:
            return queryset.filter(quantity_sold__gt=0)
        elif value is False:
            return queryset.filter(quantity_sold=0)
        return queryset
