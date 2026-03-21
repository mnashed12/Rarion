"""
Django REST Framework Serializers for Inventory App

Serializers handle converting model instances to JSON and validating
incoming data for the API endpoints.
"""

from rest_framework import serializers
from django.utils import timezone
from .models import PokemonSet, Card, InventoryItem, StreamEvent, StreamInventory
from .models import Deck


class DeckSerializer(serializers.ModelSerializer):
    prestige_stats = serializers.SerializerMethodField()

    class Meta:
        model = Deck
        fields = ['id', 'name', 'background_image', 'owner', 'created_at', 'updated_at', 'prestige_stats']
        read_only_fields = ['id', 'owner', 'created_at', 'updated_at']

    def get_prestige_stats(self, obj):
        from django.db.models import Count, Sum
        items = obj.inventory_items.filter(sold_at__isnull=True)
        # total = sum of all quantities (how many physical cards), not item count
        total_agg = items.aggregate(total=Sum('quantity'))['total'] or 0
        counts = items.values('prestige').annotate(count=Count('id'))
        prestige_counts = {c['prestige']: c['count'] for c in counts}
        return {
            'total': total_agg,
            'star': prestige_counts.get('star', 0),
            'galaxy': prestige_counts.get('galaxy', 0),
            'cosmos': prestige_counts.get('cosmos', 0),
            'rarion': prestige_counts.get('rarion', 0),
        }


class PokemonSetSerializer(serializers.ModelSerializer):
    """
    Serializer for PokemonSet model.
    Includes card count as a computed field.
    """
    
    card_count = serializers.SerializerMethodField(
        help_text="Number of cards currently in the database for this set"
    )
    
    class Meta:
        model = PokemonSet
        fields = [
            'id',
            'name',
            'set_code',
            'release_date',
            'total_cards',
            'series',
            'card_count',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'card_count']
    
    def get_card_count(self, obj):
        """Return the actual count of cards in the database for this set."""
        return obj.cards.count()
    
    def validate_set_code(self, value):
        """Ensure set_code is uppercase and stripped."""
        return value.upper().strip()
    
    def validate_release_date(self, value):
        """Ensure release date is not in the future (optional validation)."""
        if value and value > timezone.now().date():
            raise serializers.ValidationError("Release date cannot be in the future.")
        return value


class PokemonSetListSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for PokemonSet list views.
    Used when sets are nested in other serializers.
    """
    
    class Meta:
        model = PokemonSet
        fields = ['id', 'name', 'set_code', 'series']


class CardSerializer(serializers.ModelSerializer):
    """
    Serializer for Card model.
    Includes nested set information for display.
    """
    
    pokemon_set_detail = PokemonSetListSerializer(
        source='pokemon_set',
        read_only=True,
        help_text="Detailed set information"
    )
    rarity_display = serializers.CharField(
        source='get_rarity_display',
        read_only=True
    )
    card_type_display = serializers.CharField(
        source='get_card_type_display',
        read_only=True
    )
    image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Card
        fields = [
            'id',
            'name',
            'card_number',
            'pokemon_set',
            'pokemon_set_detail',
            'rarity',
            'rarity_display',
            'card_type',
            'card_type_display',
            'image',
            'image_url',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'image_url']
    
    def get_image_url(self, obj):
        """Return the full URL for the card image."""
        # Image field stores external CDN URLs
        if obj.image:
            # If URL doesn't have extension, append /high.webp for TCGdex URLs
            if 'tcgdex.net' in obj.image and not obj.image.endswith(('.jpg', '.png', '.webp')):
                return obj.image + '/high.webp'
            return obj.image
        return None
    
    def validate_card_number(self, value):
        """Ensure card number is properly formatted."""
        return value.strip()
    
    def validate(self, data):
        """Cross-field validation."""
        # Check for duplicate card in same set
        pokemon_set = data.get('pokemon_set')
        card_number = data.get('card_number')
        
        if pokemon_set and card_number:
            existing = Card.objects.filter(
                pokemon_set=pokemon_set,
                card_number=card_number
            )
            # Exclude current instance on update
            if self.instance:
                existing = existing.exclude(pk=self.instance.pk)
            
            if existing.exists():
                raise serializers.ValidationError({
                    'card_number': f"A card with number '{card_number}' already exists in this set."
                })
        
        return data


class CardListSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for Card list views.
    Used when cards are nested in other serializers.
    """
    
    set_name = serializers.CharField(source='pokemon_set.name', read_only=True)
    set_code = serializers.CharField(source='pokemon_set.set_code', read_only=True)
    
    class Meta:
        model = Card
        fields = ['id', 'name', 'card_number', 'set_name', 'set_code', 'rarity', 'card_type', 'image']


class InventoryItemSerializer(serializers.ModelSerializer):
    """
    Serializer for InventoryItem model.
    Includes card details and computed fields.
    """
    
    card_detail = CardListSerializer(
        source='card',
        read_only=True,
        help_text="Card information"
    )
    condition_display = serializers.CharField(
        source='get_condition_display',
        read_only=True
    )
    prestige_display = serializers.CharField(
        source='get_prestige_display',
        read_only=True
    )
    total_value = serializers.SerializerMethodField(
        help_text="Total value based on quantity * current_price"
    )
    profit_margin = serializers.SerializerMethodField(
        help_text="Profit/loss based on purchase vs current price"
    )
    deck = DeckSerializer(read_only=True)
    deck_id = serializers.PrimaryKeyRelatedField(
        queryset=Deck.objects.all(),
        source='deck',
        write_only=True,
        required=False
    )
    
    class Meta:
        model = InventoryItem
        fields = [
            'id',
            'card',
            'card_detail',
            'condition',
            'condition_display',
            'prestige',
            'prestige_display',
            'quantity',
            'purchase_price',
            'current_price',
            'total_value',
            'profit_margin',
            'location',
            'notes',
            'sku',
            'deck',
            'deck_id',
            'auction_code',
            'sold_at',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'sku', 'auction_code', 'created_at', 'updated_at', 'total_value', 'profit_margin']
    
    def get_total_value(self, obj):
        """Calculate total value of inventory item."""
        if obj.current_price and obj.quantity:
            return str(obj.current_price * obj.quantity)
        return None
    
    def get_profit_margin(self, obj):
        """Calculate profit margin percentage."""
        if obj.current_price and obj.purchase_price and obj.purchase_price > 0:
            margin = ((obj.current_price - obj.purchase_price) / obj.purchase_price) * 100
            return round(float(margin), 2)
        return None
    
    def validate_quantity(self, value):
        """Ensure quantity is non-negative."""
        if value < 0:
            raise serializers.ValidationError("Quantity cannot be negative.")
        return value
    
    def validate_purchase_price(self, value):
        """Ensure purchase price is non-negative if provided."""
        if value is not None and value < 0:
            raise serializers.ValidationError("Purchase price cannot be negative.")
        return value
    
    def validate_current_price(self, value):
        """Ensure current price is non-negative if provided."""
        if value is not None and value < 0:
            raise serializers.ValidationError("Current price cannot be negative.")
        return value


class InventoryItemListSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for InventoryItem list views.
    """
    
    card_name = serializers.CharField(source='card.name', read_only=True)
    set_name = serializers.CharField(source='card.pokemon_set.name', read_only=True)
    
    class Meta:
        model = InventoryItem
        fields = ['id', 'sku', 'card_name', 'set_name', 'condition', 'quantity', 'current_price']


class StreamEventSerializer(serializers.ModelSerializer):
    """
    Serializer for StreamEvent model.
    Includes computed stats about the stream.
    """
    
    platform_display = serializers.CharField(
        source='get_platform_display',
        read_only=True
    )
    total_items_shown = serializers.SerializerMethodField()
    total_items_sold = serializers.SerializerMethodField()
    
    class Meta:
        model = StreamEvent
        fields = [
            'id',
            'title',
            'stream_date',
            'platform',
            'platform_display',
            'notes',
            'total_items_shown',
            'total_items_sold',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at', 'total_items_shown', 'total_items_sold']
    
    def get_total_items_shown(self, obj):
        """Calculate total items shown in this stream."""
        return sum(si.quantity_shown for si in obj.stream_inventory.all())
    
    def get_total_items_sold(self, obj):
        """Calculate total items sold in this stream."""
        return sum(si.quantity_sold for si in obj.stream_inventory.all())
    
    def validate_stream_date(self, value):
        """Validate stream date is reasonable."""
        # Allow dates up to 1 year in the future (for scheduled streams)
        max_future = timezone.now() + timezone.timedelta(days=365)
        if value > max_future:
            raise serializers.ValidationError("Stream date cannot be more than 1 year in the future.")
        return value


class StreamInventorySerializer(serializers.ModelSerializer):
    """
    Serializer for StreamInventory model.
    Links stream events to inventory items.
    """
    
    stream_event_detail = serializers.SerializerMethodField()
    inventory_item_detail = InventoryItemListSerializer(
        source='inventory_item',
        read_only=True
    )
    
    class Meta:
        model = StreamInventory
        fields = [
            'id',
            'stream_event',
            'stream_event_detail',
            'inventory_item',
            'inventory_item_detail',
            'quantity_shown',
            'quantity_sold',
            'featured',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_stream_event_detail(self, obj):
        """Return stream event summary."""
        return {
            'id': obj.stream_event.id,
            'title': obj.stream_event.title,
            'stream_date': obj.stream_event.stream_date,
            'platform': obj.stream_event.platform,
        }
    
    def validate(self, data):
        """Validate stream inventory data."""
        quantity_shown = data.get('quantity_shown', 0)
        quantity_sold = data.get('quantity_sold', 0)
        
        # Ensure sold doesn't exceed shown
        if quantity_sold > quantity_shown:
            raise serializers.ValidationError({
                'quantity_sold': "Quantity sold cannot exceed quantity shown."
            })
        
        # Validate against inventory availability
        inventory_item = data.get('inventory_item')
        if inventory_item and quantity_shown > inventory_item.quantity:
            raise serializers.ValidationError({
                'quantity_shown': f"Cannot show more than available in inventory ({inventory_item.quantity})."
            })
        
        return data


# =============================================================================
# Specialized Serializers for specific use cases
# =============================================================================

class CardWithInventorySerializer(CardSerializer):
    """
    Card serializer that includes all inventory items for the card.
    Useful for detailed card views.
    """
    
    inventory_items = InventoryItemListSerializer(
        many=True,
        read_only=True,
        source='inventory_items'
    )
    total_quantity = serializers.SerializerMethodField()
    
    class Meta(CardSerializer.Meta):
        fields = CardSerializer.Meta.fields + ['inventory_items', 'total_quantity']
    
    def get_total_quantity(self, obj):
        """Calculate total quantity across all conditions."""
        return sum(item.quantity for item in obj.inventory_items.all())


class StreamEventDetailSerializer(StreamEventSerializer):
    """
    Stream event serializer with full inventory details.
    Useful for stream detail views.
    """
    
    inventory = StreamInventorySerializer(
        many=True,
        read_only=True,
        source='stream_inventory'
    )
    
    class Meta(StreamEventSerializer.Meta):
        fields = StreamEventSerializer.Meta.fields + ['inventory']
