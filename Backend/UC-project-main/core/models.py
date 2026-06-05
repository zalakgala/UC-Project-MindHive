from django.db import models
from django.contrib.auth.models import AbstractUser


from django.utils import timezone


class User(AbstractUser):

    first_name = None
    last_name = None
    full_name = models.CharField(max_length=255)
    THEME_CHOICES = [
    ('light', 'Light'),
    ('dark', 'Dark'),
]
    SORT_CHOICES = [
    ('date', 'Date Created'),
    ('priority', 'Priority'),
    ('name', 'Name'),
]
    created_at = models.DateTimeField(auto_now_add=True)
    theme = models.CharField(max_length=20, choices=THEME_CHOICES , default="light")
    default_sort = models.CharField(max_length=50, choices=SORT_CHOICES, default="date")
    
    # New profile fields
    bio = models.TextField(blank=True, null=True)
    profile_image = models.ImageField(upload_to='profile_images/', null=True, blank=True)
    email_notifications = models.BooleanField(default=True)
    two_factor_auth = models.BooleanField(default=False)
    auto_empty_bin = models.BooleanField(default=False)
    auto_empty_days = models.IntegerField(default=30)
    is_focus_mode = models.BooleanField(default=False)
    def __str__(self):
        return self.username


   


class Folder(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    parent_folder = models.ForeignKey(
        'self', null=True, blank=True, on_delete=models.CASCADE
    )
    is_archived = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    def __str__(self):
        return self.name




class Resource(models.Model):


    RESOURCE_TYPES = [
        ("document", "Document"),
        ("link", "Link"),
        ("image", "Image"),
        ("audio", "Audio"),
        ("video","Video"),
    ]


    VISIBILITY_CHOICES = [
        ("private", "Private"),
        ("public", "Public"),
        ("shared", "Shared"),
    ]


    READING_STATUS = [
        ("to-read", "To Read"),
        ("skimmed", "Skimmed"),
        ("studied", "Studied"),
    ]


    PRIORITY_CHOICES = [
        ("high", "High"),
        ("medium", "Medium"),
        ("low", "Low"),
    ]


    user = models.ForeignKey(User, on_delete=models.CASCADE)
    folder = models.ForeignKey(Folder, null=True, blank=True, on_delete=models.SET_NULL)
    file = models.FileField(upload_to="resources/", null=True, blank=True)
    url = models.URLField(blank=True, null=True)
    title = models.CharField(max_length=255)
    #description = models.TextField(blank=True)
    type = models.CharField(max_length=20, choices=RESOURCE_TYPES)
    tags = models.JSONField(default=list, blank=True)
    last_used = models.DateTimeField(auto_now=True)

    # storage_path = models.TextField(blank=True, null=True)


    visibility = models.CharField(max_length=20, choices=VISIBILITY_CHOICES, default="private")
    reading_status = models.CharField(max_length=20, choices=READING_STATUS, default="to-read")
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default="medium")


    # estimated_read_time = models.IntegerField(default=0)


    is_archived = models.BooleanField(default=False)
    is_pinned = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


    def __str__(self):
        return self.title




class Note(models.Model):
    resource = models.ForeignKey(Resource, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


    def __str__(self):
        return f"Note on {self.resource.title}"




class Share(models.Model):
    PERMISSION_CHOICES = [
        ("view", "View"),
        ("edit", "Edit"),
        ("comment", "Comment"),
    ]


    resource = models.ForeignKey(Resource, on_delete=models.CASCADE)
    shared_with_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="shared_items")
    permissions = models.CharField(max_length=10, choices=PERMISSION_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)
    class Meta:
      unique_together = ["resource", "shared_with_user"]

class ReadingHistory(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    resource = models.ForeignKey(Resource, on_delete=models.CASCADE)


    opened_at = models.DateTimeField(auto_now_add=True)
    closed_at = models.DateTimeField(null=True, blank=True)


    def duration_spent(self):
        if self.closed_at:
            Duration_spent = self.closed_at - self.opened_at
            return (Duration_spent).total_seconds()
        return 0


    def __str__(self):
        if self.closed_at:
            duration = int(self.duration_spent())
            return f"{self.user.username} read '{self.resource.title}' for {duration} seconds at {self.opened_at}"
        return f"{self.user.username} opened '{self.resource.title}' at {self.opened_at}"


class SaveLater(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    resource = models.ForeignKey(Resource, on_delete=models.CASCADE)
    added_at = models.DateTimeField(auto_now_add=True)


    class Meta:
        unique_together = ("user", "resource")




class TrashItem(models.Model):
    ITEM_TYPES = [
        ("resource", "Resource"),
        ("folder", "Folder"),
        ("note", "Note"),
    ]


    user = models.ForeignKey(User, on_delete=models.CASCADE)
    item_id = models.IntegerField()
    type = models.CharField(max_length=20, choices=ITEM_TYPES)


    deleted_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()


    def __str__(self):
        return f"{self.type} - {self.item_id}"

class Subject(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    name = models.CharField(max_length=100)

    def __str__(self):
        return self.name


class StudySession(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, null=True, blank=True)
    duration = models.IntegerField()  # minutes
    date = models.DateField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.duration} mins"


class PomodoroSession(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    duration = models.IntegerField()  # minutes
    completed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        status = "Completed" if self.completed else "In Progress"
        return f"{self.user.username} - {self.duration} mins ({status})"