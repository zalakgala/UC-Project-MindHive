import os
import django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "notes.settings")
django.setup()

from django.test import RequestFactory
from core.views import download_resource
from core.models import Resource, User

# Create a test user and resource with a fake local file
user = User.objects.create(username="testuser")
resource = Resource.objects.create(
    user=user, 
    title="Test", 
    type="document", 
    file="resources/fake_file_that_does_not_exist.pdf"
)

factory = RequestFactory()
request = factory.get(f'/api/download/{resource.id}/')
request.user = user

response = download_resource(request, resource.id)
print("Status Code:", response.status_code)
if response.status_code == 500:
    print(response.content)
