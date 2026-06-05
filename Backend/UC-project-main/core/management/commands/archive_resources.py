from django.core.management.base import BaseCommand
from core.utils import archive_old_resources

class Command(BaseCommand):
    help = 'Archives resources that have not been used for more than 30 days'

    def handle(self, *args, **kwargs):
        archive_old_resources()
        self.stdout.write(self.style.SUCCESS('Successfully archived old resources'))
