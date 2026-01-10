from django.apps import AppConfig


class InventoryConfig(AppConfig):
    """Configuration for the Inventory application."""
    
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'inventory'
    verbose_name = 'Pokemon Card Inventory'
    
    def ready(self):
        """
        Application initialization code.
        Import signals here if needed.
        """
        pass
