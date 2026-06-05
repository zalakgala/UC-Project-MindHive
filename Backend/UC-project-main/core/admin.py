from django.contrib import admin
from .models import User, Folder, Resource, Note, Share, ReadingHistory, SaveLater, TrashItem

admin.site.register(User)
admin.site.register(Folder)
admin.site.register(Resource)
admin.site.register(Note)
admin.site.register(Share)
admin.site.register(ReadingHistory)
admin.site.register(SaveLater)
admin.site.register(TrashItem)