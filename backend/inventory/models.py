"""
Django Models for Pokemon Card Inventory

This module defines the database models for tracking Pokemon cards,
inventory items, and stream events using Django's ORM.
"""

import uuid
from decimal import Decimal
from django.db import models
from django.core.validators import MinValueValidator
from django.utils import timezone


class PokemonSet(models.Model):
    """
    Represents a Pokemon Trading Card Game set/expansion.
    
    Examples: Base Set, Jungle, Fossil, Scarlet & Violet, etc.
    """
    
    name = models.CharField(
        max_length=200,
        help_text="Full name of the Pokemon set (e.g., 'Base Set', 'Scarlet & Violet')"
    )
    set_code = models.CharField(
        max_length=20,
        unique=True,
        help_text="Unique code/abbreviation for the set (e.g., 'BS', 'SV')"
    )
    release_date = models.DateField(
        null=True,
        blank=True,
        help_text="Official release date of the set"
    )
    total_cards = models.PositiveIntegerField(
        default=0,
        help_text="Total number of cards in the set"
    )
    series = models.CharField(
        max_length=100,
        blank=True,
        help_text="The series this set belongs to (e.g., 'Original Series', 'Sword & Shield')"
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'pokemon_sets'
        ordering = ['-release_date', 'name']
        verbose_name = 'Pokemon Set'
        verbose_name_plural = 'Pokemon Sets'
    
    def __str__(self):
        return f"{self.name} ({self.set_code})"


class Card(models.Model):
    """
    Represents an individual Pokemon card.
    
    Each card belongs to a set and has various attributes like
    rarity, type, and an image stored on S3.
    """
    
    # Rarity choices
    class Rarity(models.TextChoices):
        COMMON = 'common', 'Common'
        UNCOMMON = 'uncommon', 'Uncommon'
        RARE = 'rare', 'Rare'
        HOLO_RARE = 'holo_rare', 'Holo Rare'
        ULTRA_RARE = 'ultra_rare', 'Ultra Rare'
        SECRET_RARE = 'secret_rare', 'Secret Rare'
    
    # Card type choices
    class CardType(models.TextChoices):
        POKEMON = 'pokemon', 'Pokemon'
        TRAINER = 'trainer', 'Trainer'
        ENERGY = 'energy', 'Energy'
    
    name = models.CharField(
        max_length=200,
        help_text="Name of the card (e.g., 'Charizard', 'Professor Oak')"
    )
    card_number = models.CharField(
        max_length=20,
        help_text="Card number within the set (e.g., '4/102', '001/165')"
    )
    pokemon_set = models.ForeignKey(
        PokemonSet,
        on_delete=models.CASCADE,
        related_name='cards',
        help_text="The set this card belongs to"
    )
    rarity = models.CharField(
        max_length=20,
        choices=Rarity.choices,
        default=Rarity.COMMON,
        help_text="Rarity of the card"
    )
    card_type = models.CharField(
        max_length=20,
        choices=CardType.choices,
        default=CardType.POKEMON,
        help_text="Type of card (Pokemon, Trainer, or Energy)"
    )
    image = models.ImageField(
        upload_to='card_images/%Y/%m/',
        null=True,
        blank=True,
        help_text="Card image (uploaded to S3 in production)"
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'cards'
        ordering = ['pokemon_set', 'card_number']
        verbose_name = 'Card'
        verbose_name_plural = 'Cards'
        indexes = [
            models.Index(fields=['name'], name='card_name_idx'),
            models.Index(fields=['pokemon_set'], name='card_set_idx'),
            models.Index(fields=['rarity'], name='card_rarity_idx'),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.pokemon_set.set_code} {self.card_number})"


class InventoryItem(models.Model):
    """
    Represents an inventory entry for a specific card in a specific condition.
    
    Tracks quantity, pricing, physical storage location, and auto-generates
    a unique SKU for each item.
    """
    
    # Condition choices
    class Condition(models.TextChoices):
        MINT = 'mint', 'Mint'
        NEAR_MINT = 'near_mint', 'Near Mint'
        LIGHTLY_PLAYED = 'lightly_played', 'Lightly Played'
        MODERATELY_PLAYED = 'moderately_played', 'Moderately Played'
        HEAVILY_PLAYED = 'heavily_played', 'Heavily Played'
        DAMAGED = 'damaged', 'Damaged'
    
    card = models.ForeignKey(
        Card,
        on_delete=models.CASCADE,
        related_name='inventory_items',
        help_text="The card this inventory entry is for"
    )
    condition = models.CharField(
        max_length=20,
        choices=Condition.choices,
        default=Condition.NEAR_MINT,
        help_text="Physical condition of the card(s)"
    )
    quantity = models.PositiveIntegerField(
        default=1,
        validators=[MinValueValidator(0)],
        help_text="Number of cards in this condition"
    )
    purchase_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(Decimal('0.00'))],
        help_text="Price paid for the card(s)"
    )
    current_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(Decimal('0.00'))],
        help_text="Current market value estimate"
    )
    location = models.CharField(
        max_length=100,
        blank=True,
        help_text="Physical storage location (e.g., 'Binder A, Page 3')"
    )
    notes = models.TextField(
        blank=True,
        help_text="Additional notes about this inventory item"
    )
    sku = models.CharField(
        max_length=50,
        unique=True,
        editable=False,
        help_text="Auto-generated unique Stock Keeping Unit"
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'inventory_items'
        ordering = ['-created_at']
        verbose_name = 'Inventory Item'
        verbose_name_plural = 'Inventory Items'
        # Each card + condition combination should be unique
        unique_together = ['card', 'condition']
        indexes = [
            models.Index(fields=['sku'], name='inventory_sku_idx'),
            models.Index(fields=['condition'], name='inventory_condition_idx'),
        ]
    
    def save(self, *args, **kwargs):
        """Override save to auto-generate SKU if not set."""
        if not self.sku:
            self.sku = self._generate_sku()
        super().save(*args, **kwargs)
    
    def _generate_sku(self):
        """
        Generate a unique SKU based on card info and UUID.
        Format: {SET_CODE}-{CARD_NUM}-{CONDITION_ABBR}-{UUID_SHORT}
        """
        # Get condition abbreviation
        condition_abbr = {
            'mint': 'M',
            'near_mint': 'NM',
            'lightly_played': 'LP',
            'moderately_played': 'MP',
            'heavily_played': 'HP',
            'damaged': 'D',
        }.get(self.condition, 'XX')
        
        # Generate short UUID
        short_uuid = uuid.uuid4().hex[:8].upper()
        
        # Build SKU
        set_code = self.card.pokemon_set.set_code.upper()
        card_num = self.card.card_number.replace('/', '-')
        
        return f"{set_code}-{card_num}-{condition_abbr}-{short_uuid}"
    
    def __str__(self):
        return f"{self.card.name} ({self.get_condition_display()}) - Qty: {self.quantity}"


class StreamEvent(models.Model):
    """
    Represents a live stream session where cards are shown/sold.
    
    Tracks stream metadata including platform, date, and notes.
    """
    
    # Platform choices
    class Platform(models.TextChoices):
        TWITCH = 'twitch', 'Twitch'
        YOUTUBE = 'youtube', 'YouTube'
        OTHER = 'other', 'Other'
    
    title = models.CharField(
        max_length=200,
        help_text="Title or name of the stream event"
    )
    stream_date = models.DateTimeField(
        default=timezone.now,
        help_text="Date and time of the stream"
    )
    platform = models.CharField(
        max_length=20,
        choices=Platform.choices,
        default=Platform.TWITCH,
        help_text="Platform where the stream was held"
    )
    notes = models.TextField(
        blank=True,
        help_text="Notes about the stream"
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'stream_events'
        ordering = ['-stream_date']
        verbose_name = 'Stream Event'
        verbose_name_plural = 'Stream Events'
    
    def __str__(self):
        return f"{self.title} ({self.stream_date.strftime('%Y-%m-%d')})"


class StreamInventory(models.Model):
    """
    Links inventory items to stream events.
    
    Tracks which cards were shown in a stream, how many were sold,
    and whether the item was featured.
    """
    
    stream_event = models.ForeignKey(
        StreamEvent,
        on_delete=models.CASCADE,
        related_name='stream_inventory',
        help_text="The stream event"
    )
    inventory_item = models.ForeignKey(
        InventoryItem,
        on_delete=models.CASCADE,
        related_name='stream_appearances',
        help_text="The inventory item shown in the stream"
    )
    quantity_shown = models.PositiveIntegerField(
        default=1,
        validators=[MinValueValidator(0)],
        help_text="Number of items shown during the stream"
    )
    quantity_sold = models.PositiveIntegerField(
        default=0,
        validators=[MinValueValidator(0)],
        help_text="Number of items sold during the stream"
    )
    featured = models.BooleanField(
        default=False,
        help_text="Whether this item was featured/highlighted in the stream"
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'stream_inventory'
        ordering = ['-stream_event__stream_date']
        verbose_name = 'Stream Inventory Item'
        verbose_name_plural = 'Stream Inventory Items'
    
    def __str__(self):
        return f"{self.inventory_item.card.name} in {self.stream_event.title}"
