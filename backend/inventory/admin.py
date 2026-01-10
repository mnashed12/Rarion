"""
Django Admin Configuration for Inventory App

Configures the Django admin interface for managing Pokemon cards,
inventory items, and stream events.
"""

from django.contrib import admin
from .models import PokemonSet, Card, InventoryItem, StreamEvent, StreamInventory


@admin.register(PokemonSet)
class PokemonSetAdmin(admin.ModelAdmin):
    """Admin configuration for Pokemon sets."""
    
    list_display = ('name', 'set_code', 'series', 'release_date', 'total_cards')
    list_filter = ('series', 'release_date')
    search_fields = ('name', 'set_code', 'series')
    ordering = ('-release_date', 'name')
    readonly_fields = ('created_at', 'updated_at')
    
    fieldsets = (
        (None, {
            'fields': ('name', 'set_code', 'series')
        }),
        ('Set Details', {
            'fields': ('release_date', 'total_cards')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(Card)
class CardAdmin(admin.ModelAdmin):
    """Admin configuration for Pokemon cards."""
    
    list_display = ('name', 'card_number', 'pokemon_set', 'rarity', 'card_type')
    list_filter = ('rarity', 'card_type', 'pokemon_set')
    search_fields = ('name', 'card_number', 'pokemon_set__name')
    ordering = ('pokemon_set', 'card_number')
    readonly_fields = ('created_at', 'updated_at')
    autocomplete_fields = ('pokemon_set',)
    
    fieldsets = (
        (None, {
            'fields': ('name', 'card_number', 'pokemon_set')
        }),
        ('Card Details', {
            'fields': ('rarity', 'card_type', 'image')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(InventoryItem)
class InventoryItemAdmin(admin.ModelAdmin):
    """Admin configuration for inventory items."""
    
    list_display = ('sku', 'card', 'condition', 'quantity', 'current_price', 'location')
    list_filter = ('condition', 'card__pokemon_set')
    search_fields = ('sku', 'card__name', 'location', 'notes')
    ordering = ('-created_at',)
    readonly_fields = ('sku', 'created_at', 'updated_at')
    autocomplete_fields = ('card',)
    
    fieldsets = (
        (None, {
            'fields': ('card', 'condition', 'quantity', 'sku')
        }),
        ('Pricing', {
            'fields': ('purchase_price', 'current_price')
        }),
        ('Storage', {
            'fields': ('location', 'notes')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


class StreamInventoryInline(admin.TabularInline):
    """Inline admin for stream inventory items."""
    
    model = StreamInventory
    extra = 1
    autocomplete_fields = ('inventory_item',)


@admin.register(StreamEvent)
class StreamEventAdmin(admin.ModelAdmin):
    """Admin configuration for stream events."""
    
    list_display = ('title', 'platform', 'stream_date', 'created_at')
    list_filter = ('platform', 'stream_date')
    search_fields = ('title', 'notes')
    ordering = ('-stream_date',)
    readonly_fields = ('created_at',)
    inlines = [StreamInventoryInline]
    
    fieldsets = (
        (None, {
            'fields': ('title', 'platform', 'stream_date')
        }),
        ('Notes', {
            'fields': ('notes',)
        }),
        ('Timestamps', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )


@admin.register(StreamInventory)
class StreamInventoryAdmin(admin.ModelAdmin):
    """Admin configuration for stream inventory links."""
    
    list_display = ('stream_event', 'inventory_item', 'quantity_shown', 'quantity_sold', 'featured')
    list_filter = ('featured', 'stream_event__platform', 'stream_event')
    search_fields = ('inventory_item__card__name', 'stream_event__title')
    ordering = ('-stream_event__stream_date',)
    readonly_fields = ('created_at', 'updated_at')
    autocomplete_fields = ('stream_event', 'inventory_item')
