"""
URL routing for Inventory App API

Uses Django REST Framework's DefaultRouter to automatically
generate URL patterns for all ViewSets.
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    PokemonSetViewSet,
    CardViewSet,
    InventoryItemViewSet,
    StreamEventViewSet,
    StreamInventoryViewSet,
    DeckViewSet,
)

# Create router and register viewsets
router = DefaultRouter()

# Register all viewsets with the router
# This automatically creates URL patterns for list, create, retrieve, update, delete
router.register(r'sets', PokemonSetViewSet, basename='pokemonset')
router.register(r'cards', CardViewSet, basename='card')
router.register(r'inventory', InventoryItemViewSet, basename='inventoryitem')
router.register(r'streams', StreamEventViewSet, basename='streamevent')
router.register(r'stream-inventory', StreamInventoryViewSet, basename='streaminventory')
router.register(r'decks', DeckViewSet, basename='deck')

# App name for URL namespacing
app_name = 'inventory'

# URL patterns
urlpatterns = [
    # Include all router-generated URLs
    path('', include(router.urls)),
    
    # Explicit routes for QR scan actions (belt-and-suspenders alongside router)
    path('inventory/recent_scans/', InventoryItemViewSet.as_view({'get': 'recent_scans'}), name='inventory-recent-scans'),
    path('inventory/sell_by_code/', InventoryItemViewSet.as_view({'post': 'sell_by_code'}), name='inventory-sell-by-code'),
    path('inventory/unsell_by_code/', InventoryItemViewSet.as_view({'post': 'unsell_by_code'}), name='inventory-unsell-by-code'),
    path('inventory/auto_assign_prestige/', InventoryItemViewSet.as_view({'post': 'auto_assign_prestige'}), name='inventory-auto-assign-prestige'),
    path('inventory/prestige_by_deck/', InventoryItemViewSet.as_view({'get': 'prestige_by_deck'}), name='inventory-prestige-by-deck'),
]

# =============================================================================
# Generated URL Patterns:
# =============================================================================
#
# Pokemon Sets:
#   GET    /api/sets/              - List all sets
#   POST   /api/sets/              - Create a set
#   GET    /api/sets/{id}/         - Retrieve a set
#   PUT    /api/sets/{id}/         - Update a set
#   PATCH  /api/sets/{id}/         - Partial update
#   DELETE /api/sets/{id}/         - Delete a set
#   GET    /api/sets/{id}/cards/   - List cards in set
#   GET    /api/sets/stats/        - Get set statistics
#
# Cards:
#   GET    /api/cards/                    - List all cards
#   POST   /api/cards/                    - Create a card
#   GET    /api/cards/{id}/               - Retrieve a card
#   PUT    /api/cards/{id}/               - Update a card
#   PATCH  /api/cards/{id}/               - Partial update
#   DELETE /api/cards/{id}/               - Delete a card
#   GET    /api/cards/{id}/inventory/     - List inventory for card
#   POST   /api/cards/{id}/upload-image/  - Upload card image
#
# Inventory Items:
#   GET    /api/inventory/                      - List all items
#   POST   /api/inventory/                      - Create an item
#   GET    /api/inventory/{id}/                 - Retrieve an item
#   PUT    /api/inventory/{id}/                 - Update an item
#   PATCH  /api/inventory/{id}/                 - Partial update
#   DELETE /api/inventory/{id}/                 - Delete an item
#   GET    /api/inventory/stats/                - Get inventory stats
#   POST   /api/inventory/{id}/adjust-quantity/ - Adjust quantity
#
# Stream Events:
#   GET    /api/streams/                - List all streams
#   POST   /api/streams/                - Create a stream
#   GET    /api/streams/{id}/           - Retrieve a stream
#   PUT    /api/streams/{id}/           - Update a stream
#   PATCH  /api/streams/{id}/           - Partial update
#   DELETE /api/streams/{id}/           - Delete a stream
#   GET    /api/streams/{id}/inventory/ - List inventory for stream
#   GET    /api/streams/stats/          - Get stream statistics
#
# Stream Inventory:
#   GET    /api/stream-inventory/       - List all links
#   POST   /api/stream-inventory/       - Create a link
#   GET    /api/stream-inventory/{id}/  - Retrieve a link
#   PUT    /api/stream-inventory/{id}/  - Update a link
#   PATCH  /api/stream-inventory/{id}/  - Partial update
#   DELETE /api/stream-inventory/{id}/  - Delete a link
#
# =============================================================================
