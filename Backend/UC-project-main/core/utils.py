from django.utils import timezone
from datetime import timedelta
from .models import Resource

def archive_old_resources():
    threshold = timezone.now() - timedelta(days=30)

    Resource.objects.filter(
        last_used__lt=threshold,
        is_archived=False
    ).update(is_archived=True)
