from django.db import migrations, models


def add_columns_if_missing(apps, schema_editor):
    """Safely add watchlist and date_added columns — works on both SQLite and PostgreSQL."""
    connection = schema_editor.connection
    vendor = connection.vendor  # 'sqlite' or 'postgresql'

    with connection.cursor() as cursor:
        if vendor == 'sqlite':
            cursor.execute("PRAGMA table_info(inventory_items)")
            columns = [row[1] for row in cursor.fetchall()]
        else:
            cursor.execute("""
                SELECT column_name FROM information_schema.columns
                WHERE table_name = 'inventory_items'
            """)
            columns = [row[0] for row in cursor.fetchall()]

        if 'watchlist' not in columns:
            if vendor == 'sqlite':
                cursor.execute(
                    "ALTER TABLE inventory_items ADD COLUMN watchlist BOOLEAN NOT NULL DEFAULT 0"
                )
            else:
                cursor.execute(
                    "ALTER TABLE inventory_items ADD COLUMN watchlist BOOLEAN NOT NULL DEFAULT FALSE"
                )
        if 'date_added' not in columns:
            cursor.execute(
                "ALTER TABLE inventory_items ADD COLUMN date_added DATE NULL"
            )


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('inventory', '0015_alter_inventoryitem_grade_alter_inventoryitem_rarity_and_more'),
    ]

    operations = [
        migrations.RunPython(add_columns_if_missing, reverse_code=noop),
        migrations.SeparateDatabaseAndState(
            database_operations=[],
            state_operations=[
                migrations.AddField(
                    model_name='inventoryitem',
                    name='watchlist',
                    field=models.BooleanField(default=False, help_text='Whether this card is on the watchlist'),
                ),
                migrations.AddField(
                    model_name='inventoryitem',
                    name='date_added',
                    field=models.DateField(blank=True, null=True, help_text='Date the card was added to the portfolio'),
                ),
            ]
        ),
    ]
