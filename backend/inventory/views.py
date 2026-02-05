"""
Django REST Framework ViewSets for Inventory App

Defines API ViewSets with full CRUD operations, filtering,
searching, and pagination for all models.
"""

import logging
import io
import base64
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.db.models import Sum, Count, Avg
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.http import HttpResponse

from .models import PokemonSet, Card, InventoryItem, StreamEvent, StreamInventory, Deck
from .serializers import (
    PokemonSetSerializer,
    CardSerializer,
    CardWithInventorySerializer,
    InventoryItemSerializer,
    StreamEventSerializer,
    StreamEventDetailSerializer,
    StreamInventorySerializer,
    DeckSerializer,
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
    ordering_fields = ['name', 'card_number', 'rarity', 'pokemon_set__name', 'pokemon_set__release_date', 'created_at']
    ordering = ['pokemon_set__release_date', 'card_number']
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

    @action(detail=False, methods=['post'])
    def sell_by_code(self, request):
        """
        Mark a card as sold by scanning its QR/barcode.
        
        Body: {"auction_code": "uuid-string"}
        
        This sets the sold_at timestamp without deleting the card.
        """
        auction_code = request.data.get('auction_code', '').strip()
        
        if not auction_code:
            return Response(
                {'error': 'Auction code is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            item = InventoryItem.objects.select_related('card', 'card__pokemon_set', 'deck').get(
                auction_code=auction_code
            )
        except InventoryItem.DoesNotExist:
            return Response(
                {'error': 'Card not found with this code'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if already sold
        if item.sold_at:
            return Response({
                'error': 'This card has already been sold',
                'sold_at': item.sold_at.isoformat(),
                'card_name': item.card.name if item.card else 'Unknown'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Mark as sold
        item.sold_at = timezone.now()
        item.save(update_fields=['sold_at'])
        
        logger.info(f"Card sold via scan: {item.sku} - {item.card.name if item.card else 'Unknown'}")
        
        serializer = self.get_serializer(item)
        return Response({
            'success': True,
            'message': f'Sold: {item.card.name if item.card else "Unknown Card"}',
            'item': serializer.data
        })

    @action(detail=False, methods=['post'])
    def unsell_by_code(self, request):
        """
        Undo a sale by clearing the sold_at timestamp.
        
        Body: {"auction_code": "uuid-string"}
        """
        auction_code = request.data.get('auction_code', '').strip()
        
        if not auction_code:
            return Response(
                {'error': 'Auction code is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            item = InventoryItem.objects.select_related('card', 'deck').get(
                auction_code=auction_code
            )
        except InventoryItem.DoesNotExist:
            return Response(
                {'error': 'Card not found with this code'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        if not item.sold_at:
            return Response({
                'error': 'This card is not marked as sold',
                'card_name': item.card.name if item.card else 'Unknown'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Clear sold status
        item.sold_at = None
        item.save(update_fields=['sold_at'])
        
        logger.info(f"Sale undone via scan: {item.sku}")
        
        serializer = self.get_serializer(item)
        return Response({
            'success': True,
            'message': f'Restored: {item.card.name if item.card else "Unknown Card"}',
            'item': serializer.data
        })


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


class DeckViewSet(viewsets.ModelViewSet):
    queryset = Deck.objects.all()
    serializer_class = DeckSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    
    def get_queryset(self):
        # For now, return all decks since auth is not implemented
        # Later: filter by user when authentication is added
        return Deck.objects.all()
    
    def perform_create(self, serializer):
        # For now, use a default user ID of 1
        # Later: use self.request.user when authentication is added
        from django.contrib.auth import get_user_model
        User = get_user_model()
        default_user = User.objects.first()
        if default_user:
            serializer.save(owner=default_user)
        else:
            # Create a default user if none exists
            default_user = User.objects.create_user(username='default', password='default')
            serializer.save(owner=default_user)
    
    @action(detail=True, methods=['get'])
    def print_labels(self, request, pk=None):
        """
        Generate a printable HTML page with QR code labels for all cards in the deck.
        Labels are sized to fit Pokemon card dimensions (2.5" x 3.5").
        """
        import qrcode
        from io import BytesIO
        
        deck = self.get_object()
        items = InventoryItem.objects.select_related('card', 'card__pokemon_set').filter(
            deck=deck, 
            sold_at__isnull=True  # Only unsold cards
        ).order_by('card__name')
        
        labels_html = []
        
        for item in items:
            # Generate QR code
            qr = qrcode.QRCode(
                version=1,
                error_correction=qrcode.constants.ERROR_CORRECT_M,
                box_size=10,
                border=2,
            )
            qr.add_data(str(item.auction_code))
            qr.make(fit=True)
            
            # Create image
            qr_img = qr.make_image(fill_color="black", back_color="white")
            
            # Convert to base64
            buffer = BytesIO()
            qr_img.save(buffer, format='PNG')
            qr_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
            
            # Card info
            card_name = item.card.name if item.card else 'Unknown'
            set_name = item.card.pokemon_set.name if item.card and item.card.pokemon_set else 'Unknown Set'
            card_number = item.card.card_number if item.card else ''
            condition = item.get_condition_display() if hasattr(item, 'get_condition_display') else item.condition
            price = f"${item.current_price:.2f}" if item.current_price else 'N/A'
            
            # Truncate long names
            display_name = card_name[:25] + '...' if len(card_name) > 25 else card_name
            display_set = set_name[:20] + '...' if len(set_name) > 20 else set_name
            
            label_html = f'''
            <div class="label">
                <div class="qr-container">
                    <img src="data:image/png;base64,{qr_base64}" alt="QR Code" />
                </div>
                <div class="card-info">
                    <div class="card-name">{display_name}</div>
                    <div class="card-set">{display_set}</div>
                    <div class="card-details">#{card_number} • {condition}</div>
                    <div class="card-price">{price}</div>
                </div>
            </div>
            '''
            labels_html.append(label_html)
        
        # Build full HTML page
        html = f'''
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>QR Labels - {deck.name}</title>
            <style>
                @page {{
                    size: letter;
                    margin: 0.25in;
                }}
                * {{
                    box-sizing: border-box;
                    margin: 0;
                    padding: 0;
                }}
                body {{
                    font-family: Arial, sans-serif;
                    background: white;
                }}
                .header {{
                    text-align: center;
                    padding: 10px;
                    border-bottom: 2px solid #333;
                    margin-bottom: 10px;
                }}
                .header h1 {{
                    font-size: 18px;
                    margin: 0;
                }}
                .header p {{
                    font-size: 12px;
                    color: #666;
                }}
                .labels-container {{
                    display: flex;
                    flex-wrap: wrap;
                    justify-content: flex-start;
                    gap: 8px;
                    padding: 5px;
                }}
                .label {{
                    width: 2.5in;
                    height: 3.5in;
                    border: 2px solid #333;
                    border-radius: 8px;
                    padding: 8px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    background: linear-gradient(135deg, #f8f8f8 0%, #fff 100%);
                    page-break-inside: avoid;
                }}
                .qr-container {{
                    flex: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }}
                .qr-container img {{
                    width: 150px;
                    height: 150px;
                }}
                .card-info {{
                    width: 100%;
                    text-align: center;
                    padding-top: 8px;
                    border-top: 1px solid #ddd;
                }}
                .card-name {{
                    font-size: 14px;
                    font-weight: bold;
                    color: #333;
                    margin-bottom: 4px;
                }}
                .card-set {{
                    font-size: 11px;
                    color: #666;
                    margin-bottom: 2px;
                }}
                .card-details {{
                    font-size: 10px;
                    color: #888;
                    margin-bottom: 4px;
                }}
                .card-price {{
                    font-size: 16px;
                    font-weight: bold;
                    color: #059669;
                }}
                @media print {{
                    .header {{
                        position: fixed;
                        top: 0;
                        left: 0;
                        right: 0;
                        background: white;
                    }}
                    .labels-container {{
                        margin-top: 50px;
                    }}
                }}
            </style>
        </head>
        <body>
            <div class="header">
                <h1>{deck.name} - QR Labels</h1>
                <p>{len(labels_html)} cards • Print and cut along borders</p>
            </div>
            <div class="labels-container">
                {''.join(labels_html)}
            </div>
        </body>
        </html>
        '''
        
        return HttpResponse(html, content_type='text/html')

    @action(detail=True, methods=['post'])
    def import_csv(self, request, pk=None):
        """
        Import cards from a CSV file into this deck.
        Expects a multipart form with 'file' containing the CSV.
        """
        import csv
        import io
        import re
        from decimal import Decimal
        
        deck = self.get_object()
        
        if 'file' not in request.FILES:
            return Response({'error': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)
        
        csv_file = request.FILES['file']
        clear_deck = request.data.get('clear', 'false').lower() == 'true'
        
        # Read the CSV file
        try:
            decoded_file = csv_file.read().decode('utf-8')
            reader = csv.DictReader(io.StringIO(decoded_file))
        except Exception as e:
            return Response({'error': f'Failed to read CSV: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Clear deck if requested
        if clear_deck:
            InventoryItem.objects.filter(deck=deck).delete()
        
        # Condition mapping
        condition_map = {
            'mint': 'mint',
            'near mint': 'near_mint',
            'lightly played': 'lightly_played',
            'moderately played': 'moderately_played',
            'heavily played': 'heavily_played',
            'damaged': 'damaged',
        }
        
        imported = 0
        updated = 0
        not_found = 0
        errors = 0
        not_found_cards = []
        
        for row in reader:
            try:
                # Clean up values
                card_name = row.get('Card Name', '').strip('"').strip()
                card_number = row.get('Number', '').strip('"').strip()
                set_name = row.get('Set', '').strip('"').strip()
                condition_str = row.get('Condition', 'near mint').strip('"').strip().lower()
                quantity = int(row.get('Quantity', 1))
                variation = row.get('Variation', '').strip('"').strip()
                
                # Parse prices
                market_price_str = row.get('Market Price', '').replace('$', '').strip()
                purchase_price_str = row.get('Acquisition Price', '').replace('$', '').strip()
                
                market_price = Decimal(market_price_str) if market_price_str else None
                purchase_price = Decimal(purchase_price_str) if purchase_price_str else None
                
                # Map condition
                condition = condition_map.get(condition_str, 'near_mint')
                
                # Try to find the card
                card = self._find_card(card_name, card_number, set_name)
                
                if not card:
                    not_found += 1
                    not_found_cards.append(f"{card_name} ({card_number}) - {set_name}")
                    continue
                
                # Get or create inventory item
                inventory_item, inv_created = InventoryItem.objects.get_or_create(
                    card=card,
                    condition=condition,
                    deck=deck,
                    defaults={
                        'quantity': quantity,
                        'purchase_price': purchase_price,
                        'current_price': market_price or card.price_market,
                        'notes': f"Imported from CSV. Variation: {variation}" if variation else "Imported from CSV"
                    }
                )
                
                if inv_created:
                    imported += 1
                else:
                    inventory_item.quantity += quantity
                    if purchase_price:
                        inventory_item.purchase_price = purchase_price
                    if market_price:
                        inventory_item.current_price = market_price
                    inventory_item.save()
                    updated += 1
                    
            except Exception as e:
                errors += 1
                logger.error(f'Error importing row: {e}')
        
        return Response({
            'success': True,
            'imported': imported,
            'updated': updated,
            'not_found': not_found,
            'errors': errors,
            'not_found_cards': not_found_cards[:20],  # First 20
            'deck': deck.name
        })
    
    def _find_card(self, card_name, card_number, set_name):
        """Find a matching card in the database using multiple strategies."""
        import re
        
        # Clean up the card name (remove parenthetical variations)
        base_name = re.sub(r'\s*\([^)]*\)\s*$', '', card_name).strip()
        
        # Clean up card number
        clean_number = card_number.strip()
        number_match = re.match(r'^0*(\d+)/0*(\d+)$', clean_number)
        if number_match:
            normalized_number = f"{number_match.group(1)}/{number_match.group(2)}"
        else:
            normalized_number = clean_number
        
        from django.db.models import Q
        
        # Strategy 1: Exact match on name and card number
        card = Card.objects.filter(
            Q(name__iexact=card_name) | Q(name__iexact=base_name),
            card_number__iexact=clean_number
        ).exclude(image__isnull=True).exclude(image='').first()
        if card:
            return card
        
        # Strategy 2: Try with normalized card number
        card = Card.objects.filter(
            Q(name__iexact=card_name) | Q(name__iexact=base_name),
            card_number__iexact=normalized_number
        ).exclude(image__isnull=True).exclude(image='').first()
        if card:
            return card
        
        # Strategy 3: Match by card number and set name
        card = Card.objects.filter(
            Q(card_number__iexact=clean_number) | Q(card_number__iexact=normalized_number),
            pokemon_set__name__icontains=set_name.split()[0]
        ).filter(
            Q(name__icontains=base_name.split()[0]) | Q(name__icontains=base_name)
        ).exclude(image__isnull=True).exclude(image='').first()
        if card:
            return card
        
        # Strategy 4: Fuzzy match on name, exact on number
        card = Card.objects.filter(
            Q(card_number__iexact=clean_number) | Q(card_number__iexact=normalized_number)
        ).filter(
            name__icontains=base_name.split()[0]
        ).exclude(image__isnull=True).exclude(image='').first()
        if card:
            return card
        
        # Strategy 5: Match name with set (for promos)
        if 'promo' in set_name.lower() or len(clean_number) <= 4:
            card = Card.objects.filter(
                name__iexact=base_name,
                pokemon_set__name__icontains='promo'
            ).exclude(image__isnull=True).exclude(image='').first()
            if card:
                return card
        
        # Strategy 6: Just try to match by name
        card = Card.objects.filter(
            Q(name__iexact=card_name) | Q(name__iexact=base_name)
        ).exclude(image__isnull=True).exclude(image='').first()
        
        return card
