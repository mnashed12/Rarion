from django.db import migrations, models


def add_grade_column_if_missing(apps, schema_editor):
    """Safely add grade column only if it doesn't already exist."""
    with schema_editor.connection.cursor() as cursor:
        cursor.execute("PRAGMA table_info(inventory_items)")
        columns = [row[1] for row in cursor.fetchall()]
        if 'grade' not in columns:
            cursor.execute(
                "ALTER TABLE inventory_items ADD COLUMN grade VARCHAR(50) NOT NULL DEFAULT ''"
            )


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('inventory', '0013_setup_users_and_assign_decks'),
    ]

    operations = [
        migrations.RunPython(add_grade_column_if_missing, reverse_code=noop),
        migrations.AlterField(
            model_name='inventoryitem',
            name='grade',
            field=models.CharField(blank=True, default='', help_text='Card grade (e.g. PSA 10, BGS 9.5, or blank if ungraded)', max_length=50),
        ),
    ]
