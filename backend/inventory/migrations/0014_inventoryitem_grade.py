from django.db import migrations, models


def add_columns_if_missing(apps, schema_editor):
    """Safely add grade, variance, rarity columns only if they don't already exist."""
    with schema_editor.connection.cursor() as cursor:
        cursor.execute("""
            SELECT column_name FROM information_schema.columns
            WHERE table_name = 'inventory_items'
        """)
        columns = [row[0] for row in cursor.fetchall()]
        if 'grade' not in columns:
            cursor.execute(
                "ALTER TABLE inventory_items ADD COLUMN grade VARCHAR(50) NOT NULL DEFAULT ''"
            )
        if 'variance' not in columns:
            cursor.execute(
                "ALTER TABLE inventory_items ADD COLUMN variance VARCHAR(100) NOT NULL DEFAULT ''"
            )
        if 'rarity' not in columns:
            cursor.execute(
                "ALTER TABLE inventory_items ADD COLUMN rarity VARCHAR(100) NOT NULL DEFAULT ''"
            )


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('inventory', '0013_setup_users_and_assign_decks'),
    ]

    operations = [
        # Step 1: Add missing columns to the actual DB (safe — skips if they exist)
        migrations.RunPython(add_columns_if_missing, reverse_code=noop),
        # Step 2: Update Django's migration state only — no DB operations
        migrations.SeparateDatabaseAndState(
            database_operations=[],
            state_operations=[
                migrations.AddField(
                    model_name='inventoryitem',
                    name='grade',
                    field=models.CharField(blank=True, default='', max_length=50),
                ),
                migrations.AddField(
                    model_name='inventoryitem',
                    name='variance',
                    field=models.CharField(blank=True, default='', max_length=100),
                ),
                migrations.AddField(
                    model_name='inventoryitem',
                    name='rarity',
                    field=models.CharField(blank=True, default='', max_length=100),
                ),
            ]
        ),
    ]

