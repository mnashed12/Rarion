from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('inventory', '0017_remove_inventoryitem_unique_together'),
    ]

    operations = [
        migrations.AddField(
            model_name='inventoryitem',
            name='qr_sequence',
            field=models.PositiveIntegerField(
                blank=True,
                db_index=True,
                help_text='Global sequential number printed on QR label (highest-value card in deck = lowest number)',
                null=True,
                unique=True,
            ),
        ),
    ]
