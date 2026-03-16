"""
Data migration: create 'mina' and 'danny' Django users and assign all
existing decks to 'mina'.
"""

from django.db import migrations


def setup_users_and_assign_decks(apps, schema_editor):
    from django.contrib.auth import get_user_model
    User = get_user_model()

    mina, _ = User.objects.get_or_create(
        username='mina',
        defaults={'is_active': True, 'is_staff': False},
    )
    User.objects.get_or_create(
        username='danny',
        defaults={'is_active': True, 'is_staff': False},
    )

    # Assign every existing deck to mina
    Deck = apps.get_model('inventory', 'Deck')
    Deck.objects.all().update(owner_id=mina.pk)


class Migration(migrations.Migration):

    dependencies = [
        ('inventory', '0012_deck_background_image'),
    ]

    operations = [
        migrations.RunPython(
            setup_users_and_assign_decks,
            migrations.RunPython.noop,
        ),
    ]
