"""
Add GIN index to field_metadata column for all existing tables.

This migration ensures all tables that have the field_metadata column also have
a GIN index on it for efficient JSONB containment and existence queries.

The index was added to the model generation code, so new tables will get it
automatically. This migration handles existing tables that were created before
the index was added to the model or via the lazy column creation process.
"""

from django.db import migrations


def add_gin_indexes(apps, schema_editor):
    """
    Add GIN index on field_metadata column for all existing tables.

    Uses CREATE INDEX IF NOT EXISTS to be idempotent - if the index was
    already created by the lazy column creation process, this is a no-op.
    """

    from django.db import connection

    Table = apps.get_model("database", "Table")

    # Only process tables that have the field_metadata column
    tables_with_metadata = Table.objects.filter(
        field_metadata_column_added=True
    ).values_list("id", flat=True)

    with connection.cursor() as cursor:
        for table_id in tables_with_metadata:
            table_name = f"database_table_{table_id}"
            index_name = f"tbl_{table_id}_field_metadata_gin_idx"

            # Check if table exists (it might have been deleted)
            cursor.execute(
                """
                SELECT EXISTS (
                    SELECT FROM pg_tables
                    WHERE tablename = %s
                )
                """,
                [table_name],
            )
            table_exists = cursor.fetchone()[0]

            if table_exists:
                # Create index if not exists
                cursor.execute(
                    f'CREATE INDEX IF NOT EXISTS "{index_name}" '
                    f'ON "{table_name}" USING GIN ("field_metadata")'
                )


def remove_gin_indexes(apps, schema_editor):
    """
    Remove GIN indexes for rollback.

    Note: This will remove ALL field_metadata GIN indexes, even those that
    were created by the lazy column creation process.
    """

    from django.db import connection

    Table = apps.get_model("database", "Table")

    tables_with_metadata = Table.objects.filter(
        field_metadata_column_added=True
    ).values_list("id", flat=True)

    with connection.cursor() as cursor:
        for table_id in tables_with_metadata:
            index_name = f"tbl_{table_id}_field_metadata_gin_idx"

            cursor.execute(f'DROP INDEX IF EXISTS "{index_name}"')


class Migration(migrations.Migration):
    dependencies = [
        ("database", "0202_alter_table_field_metadata_column_added"),
    ]

    operations = [
        migrations.RunPython(
            add_gin_indexes,
            remove_gin_indexes,
        ),
    ]
