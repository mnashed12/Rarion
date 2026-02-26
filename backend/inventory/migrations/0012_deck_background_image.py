from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('inventory', '0011_remove_card_price_fields'),
    ]

    operations = [
        migrations.AddField(
            model_name='deck',
            name='background_image',
            field=models.CharField(
                choices=[('PAKMAKDECK', 'Pakmak Deck'), ('DANNYDECK', 'Danny Deck')],
                default='PAKMAKDECK',
                help_text='Background image for the deck card',
                max_length=20,
            ),
        ),
    ]
