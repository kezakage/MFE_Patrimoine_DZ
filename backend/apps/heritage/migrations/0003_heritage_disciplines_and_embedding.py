"""
Adds the multidimensional `disciplines` M2M and the dense semantic `embedding`
vector to HeritageResource.

The pgvector extension is already enabled by `chatbot/migrations/0001_initial`
(VectorExtension()), so no need to re-run it here.
"""
import pgvector.django.indexes
import pgvector.django.vector
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("heritage", "0002_heritageresource_cover_image_url"),
        ("accounts", "0001_initial"),
        # KnowledgeChunk migration is the one that runs VectorExtension(); make
        # sure pgvector is installed before we declare a VectorField here.
        ("chatbot", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="heritageresource",
            name="disciplines",
            field=models.ManyToManyField(
                blank=True,
                related_name="heritage_resources",
                to="accounts.discipline",
            ),
        ),
        migrations.AddField(
            model_name="heritageresource",
            name="embedding",
            field=pgvector.django.vector.VectorField(
                blank=True, dimensions=768, null=True,
            ),
        ),
        migrations.AddIndex(
            model_name="heritageresource",
            index=pgvector.django.indexes.HnswIndex(
                ef_construction=64,
                fields=["embedding"],
                m=16,
                name="heritage_embedding_hnsw",
                opclasses=["vector_cosine_ops"],
            ),
        ),
    ]
