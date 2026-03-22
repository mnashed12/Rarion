from django.db import migrations


def backfill_qr_sequence(apps, schema_editor):
    InventoryItem = apps.get_model('inventory', 'InventoryItem')
    from django.db.models import Max

    # Find the highest sequence already assigned (from any new imports done after 0018)
    max_seq = (
        InventoryItem.objects.filter(qr_sequence__isnull=False)
        .aggregate(Max('qr_sequence'))['qr_sequence__max'] or 0
    )

    # Items with a known price — most expensive first, ties broken by id
    with_price = list(
        InventoryItem.objects.filter(
            qr_sequence__isnull=True,
            current_price__isnull=False,
        ).order_by('-current_price', 'id')
    )

    # Items with no price — ordered by id
    without_price = list(
        InventoryItem.objects.filter(
            qr_sequence__isnull=True,
            current_price__isnull=True,
        ).order_by('id')
    )

    all_items = with_price + without_price

    for i, item in enumerate(all_items):
        item.qr_sequence = max_seq + i + 1

    InventoryItem.objects.bulk_update(all_items, ['qr_sequence'], batch_size=500)


class Migration(migrations.Migration):

    dependencies = [
        ('inventory', '0018_inventoryitem_qr_sequence'),
    ]

    operations = [
        migrations.RunPython(backfill_qr_sequence, migrations.RunPython.noop),
    ]
