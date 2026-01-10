"""
Django REST Framework ViewSets for Inventory App

Defines API ViewSets with full CRUD operations, filtering,
searching, and pagination for all models.
"""

import logging
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.db.models import Sum, Count, Avg
from django.shortcuts import get_object_or_404

from .models import PokemonSet, Card, InventoryItem, StreamEvent, StreamInventory
from .serializers import (
    PokemonSetSerializer,
    CardSerializer,
    CardWithInventorySerializer,
    InventoryItemSerializer,
    StreamEventSerializer,
    StreamEventDetailSerializer,
    StreamInventorySerializer,
)
from .filters import (
    PokemonSetFilter,
    CardFilter,
    InventoryItemFilter,
    StreamEventFilter,
    StreamInventoryFilter,
)

# Configure logger
logger = logging.getLogger(__name__)


class PokemonSetViewSet(viewsets.ModelViewSet):
    """
    API ViewSet for Pokemon Sets.
    
    Provides full CRUD operations with filtering, searching, and ordering.
    
    Endpoints:
    - GET /api/sets/ - List all sets
    - POST /api/sets/ - Create a new set
    - GET /api/sets/{id}/ - Retrieve a set
    - PUT /api/sets/{id}/ - Update a set
    - PATCH /api/sets/{id}/ - Partial update a set
    - DELETE /api/sets/{id}/ - Delete a set
    - GET /api/sets/{id}/cards/ - List all cards in a set
    - GET /api/sets/stats/ - Get aggregate statistics
    """
    
    queryset = PokemonSet.objects.all()
    serializer_class = PokemonSetSerializer
    filterset_class = PokemonSetFilter
    search_fields = ['name', 'set_code', 'series']
    ordering_fields = ['name', 'set_code', 'release_date', 'total_cards', 'created_at']
    ordering = ['-release_date']
    
    def perform_create(self, serializer):
        """Log set creation."""
        instance = serializer.save()
        logger.info(f"Created Pokemon set: {instance.name} ({instance.set_code})")
    
    def perform_destroy(self, instance):
        """Log set deletion."""
        logger.info(f"Deleted Pokemon set: {instance.name} ({instance.set_code})")
        instance.delete()
    
    @action(detail=True, methods=['get'])
    def cards(self, request, pk=None):
        """Get all cards in a specific set."""
        pokemon_set = self.get_object()
        cards = pokemon_set.cards.all()
        
        # Apply pagination
        page = self.paginate_queryset(cards)
        if page is not None:
            serializer = CardSerializer(page, many=True, context={'request': request})
            return self.get_paginated_response(serializer.data)
        
        serializer = CardSerializer(cards, many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get aggregate statistics for all sets."""
        stats = {
            'total_sets': PokemonSet.objects.count(),
            'total_cards_in_db': Card.objects.count(),
            'sets_by_series': list(
                PokemonSet.objects.values('series')
                .annotate(count=Count('id'))
                .order_by('-count')
            ),
            'latest_set': PokemonSetSerializer(
                PokemonSet.objects.order_by('-release_date').first()
            ).data if PokemonSet.objects.exists() else None
        }
        return Response(stats)


class CardViewSet(viewsets.ModelViewSet):
    """
    API ViewSet for Pokemon Cards.
    
    Provides full CRUD operations with image upload support,
    filtering, searching, and ordering.
    
    Endpoints:
    - GET /api/cards/ - List all cards
    - POST /api/cards/ - Create a new card
    - GET /api/cards/{id}/ - Retrieve a card
    - PUT /api/cards/{id}/ - Update a card
    - PATCH /api/cards/{id}/ - Partial update a card
    - DELETE /api/cards/{id}/ - Delete a card
    - GET /api/cards/{id}/inventory/ - Get inventory for this card
    - POST /api/cards/{id}/upload-image/ - Upload card image
    """
    
    queryset = Card.objects.select_related('pokemon_set').all()
    serializer_class = CardSerializer
    filterset_class = CardFilter
    search_fields = ['name', 'card_number', 'pokemon_set__name', 'pokemon_set__set_code']
    ordering_fields = ['name', 'card_number', 'rarity', 'pokemon_set__name', 'created_at']
    ordering = ['pokemon_set', 'card_number']
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    
    def get_serializer_class(self):
        """Use detailed serializer for retrieve action."""
        if self.action == 'retrieve':
            return CardWithInventorySerializer
        return CardSerializer
    
    def perform_create(self, serializer):
        """Log card creation."""
        instance = serializer.save()
        logger.info(f"Created card: {instance.name} in {instance.pokemon_set.set_code}")
    
    def perform_destroy(self, instance):
        """Log card deletion."""
        logger.info(f"Deleted card: {instance.name} in {instance.pokemon_set.set_code}")
        instance.delete()
    
    @action(detail=True, methods=['get'])
    def inventory(self, request, pk=None):
        """Get all inventory items for a specific card."""
        card = self.get_object()
        inventory = card.inventory_items.all()
        serializer = InventoryItemSerializer(inventory, many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], parser_classes=[MultiPartParser])
    def upload_image(self, request, pk=None):
        """Upload an image for a card."""
        card = self.get_object()
        
        if 'image' not in request.FILES:
            return Response(
                {'error': 'No image file provided'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Delete old image if exists
        if card.image:
            card.image.delete(save=False)
        
        card.image = request.FILES['image']
        card.save()
        
        logger.info(f"Uploaded image for card: {card.name}")
        
        serializer = self.get_serializer(card)
        return Response(serializer.data)


class InventoryItemViewSet(viewsets.ModelViewSet):
    """
    API ViewSet for Inventory Items.
    
    Provides full CRUD operations with filtering, searching,
    and comprehensive inventory management features.
    
    Endpoints:
    - GET /api/inventory/ - List all inventory items
    - POST /api/inventory/ - Create a new inventory item
    - GET /api/inventory/{id}/ - Retrieve an inventory item
    - PUT /api/inventory/{id}/ - Update an inventory item
    - PATCH /api/inventory/{id}/ - Partial update
    - DELETE /api/inventory/{id}/ - Delete an inventory item
    - GET /api/inventory/stats/ - Get inventory statistics
    - POST /api/inventory/{id}/adjust-quantity/ - Adjust quantity
    """
    
    queryset = InventoryItem.objects.select_related(
        'card', 'card__pokemon_set'
    ).all()
    serializer_class = InventoryItemSerializer
    filterset_class = InventoryItemFilter
    search_fields = ['sku', 'card__name', 'location', 'notes', 'card__pokemon_set__name']
    ordering_fields = ['created_at', 'quantity', 'current_price', 'condition', 'card__name']
    ordering = ['-created_at']
    
    def perform_create(self, serializer):
        """Log inventory creation."""
        instance = serializer.save()
        logger.info(f"Created inventory item: {instance.sku}")
    
    def perform_destroy(self, instance):
        """Log inventory deletion."""
        logger.info(f"Deleted inventory item: {instance.sku}")
        instance.delete()
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get aggregate statistics for inventory."""
        queryset = self.filter_queryset(self.get_queryset())
        
        stats = {
            'total_items': queryset.count(),
            'total_quantity': queryset.aggregate(total=Sum('quantity'))['total'] or 0,
            'total_value': queryset.aggregate(
                total=Sum('current_price')
            )['total'] or 0,
            'average_price': queryset.aggregate(
                avg=Avg('current_price')
            )['avg'] or 0,
            'by_condition': list(
                queryset.values('condition')
                .annotate(
                    count=Count('id'),
                    total_qty=Sum('quantity')
                )
                .order_by('condition')
            ),
            'low_stock': queryset.filter(quantity__lte=2, quantity__gt=0).count(),
            'out_of_stock': queryset.filter(quantity=0).count(),
        }
        return Response(stats)
    
    @action(detail=True, methods=['post'])
    def adjust_quantity(self, request, pk=None):
        """
        Adjust inventory quantity.
        
        Body: {"adjustment": 5} for adding, {"adjustment": -3} for removing
        """
        item = self.get_object()
        adjustment = request.data.get('adjustment', 0)
        
        try:
            adjustment = int(adjustment)
        except (ValueError, TypeError):
            return Response(
                {'error': 'Adjustment must be an integer'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        new_quantity = item.quantity + adjustment
        if new_quantity < 0:
            return Response(
                {'error': 'Cannot reduce quantity below zero'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        old_quantity = item.quantity
        item.quantity = new_quantity
        item.save()
        
        logger.info(f"Adjusted inventory {item.sku}: {old_quantity} -> {new_quantity}")
        
        serializer = self.get_serializer(item)
        return Response(serializer.data)


class StreamEventViewSet(viewsets.ModelViewSet):
    """
    API ViewSet for Stream Events.
    
    Provides full CRUD operations for managing stream sessions.
    
    Endpoints:
    - GET /api/streams/ - List all stream events
    - POST /api/streams/ - Create a new stream event
    - GET /api/streams/{id}/ - Retrieve a stream event
    - PUT /api/streams/{id}/ - Update a stream event
    - PATCH /api/streams/{id}/ - Partial update
    - DELETE /api/streams/{id}/ - Delete a stream event
    - GET /api/streams/{id}/inventory/ - Get inventory for this stream
    - GET /api/streams/stats/ - Get stream statistics
    """
    
    queryset = StreamEvent.objects.prefetch_related('stream_inventory').all()
    serializer_class = StreamEventSerializer
    filterset_class = StreamEventFilter
    search_fields = ['title', 'notes']
    ordering_fields = ['stream_date', 'title', 'platform', 'created_at']
    ordering = ['-stream_date']
    
    def get_serializer_class(self):
        """Use detailed serializer for retrieve action."""
        if self.action == 'retrieve':
            return StreamEventDetailSerializer
        return StreamEventSerializer
    
    def perform_create(self, serializer):
        """Log stream event creation."""
        instance = serializer.save()
        logger.info(f"Created stream event: {instance.title}")
    
    def perform_destroy(self, instance):
        """Log stream event deletion."""
        logger.info(f"Deleted stream event: {instance.title}")
        instance.delete()
    
    @action(detail=True, methods=['get'])
    def inventory(self, request, pk=None):
        """Get all inventory items for a specific stream."""
        stream = self.get_object()
        inventory = stream.stream_inventory.select_related('inventory_item', 'inventory_item__card').all()
        serializer = StreamInventorySerializer(inventory, many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get aggregate statistics for streams."""
        queryset = self.filter_queryset(self.get_queryset())
        
        stats = {
            'total_streams': queryset.count(),
            'by_platform': list(
                queryset.values('platform')
                .annotate(count=Count('id'))
                .order_by('-count')
            ),
            'recent_streams': StreamEventSerializer(
                queryset.order_by('-stream_date')[:5],
                many=True
            ).data,
        }
        return Response(stats)


class StreamInventoryViewSet(viewsets.ModelViewSet):
    """
    API ViewSet for Stream Inventory links.
    
    Manages the relationship between streams and inventory items.
    
    Endpoints:
    - GET /api/stream-inventory/ - List all stream inventory links
    - POST /api/stream-inventory/ - Create a new link
    - GET /api/stream-inventory/{id}/ - Retrieve a link
    - PUT /api/stream-inventory/{id}/ - Update a link
    - PATCH /api/stream-inventory/{id}/ - Partial update
    - DELETE /api/stream-inventory/{id}/ - Delete a link
    """
    
    queryset = StreamInventory.objects.select_related(
        'stream_event',
        'inventory_item',
        'inventory_item__card',
        'inventory_item__card__pokemon_set'
    ).all()
    serializer_class = StreamInventorySerializer
    filterset_class = StreamInventoryFilter
    search_fields = ['inventory_item__card__name', 'stream_event__title']
    ordering_fields = ['stream_event__stream_date', 'quantity_shown', 'quantity_sold', 'featured']
    ordering = ['-stream_event__stream_date']
    
    def perform_create(self, serializer):
        """Log stream inventory creation."""
        instance = serializer.save()
        logger.info(f"Added {instance.inventory_item.card.name} to stream {instance.stream_event.title}")
    
    def perform_destroy(self, instance):
        """Log stream inventory deletion."""
        logger.info(f"Removed {instance.inventory_item.card.name} from stream {instance.stream_event.title}")
        instance.delete()
