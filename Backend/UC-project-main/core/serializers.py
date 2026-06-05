from rest_framework import serializers
from .models import User, Resource, Folder, Note, SaveLater, Subject, StudySession, PomodoroSession

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id", "username", "email", "full_name", "bio", 
            "profile_image", "email_notifications", "two_factor_auth", 
            "auto_empty_bin", "auto_empty_days", "theme", "default_sort","is_focus_mode"
        ]
        read_only_fields = ["id", "username"]




class ResourceSerializer(serializers.ModelSerializer):


    class Meta:
        model = Resource
        fields = "__all__"
        read_only_fields = ["user", "created_at", "updated_at"]




class FolderSerializer(serializers.ModelSerializer):


    class Meta:
        model = Folder
        fields = "__all__"
        read_only_fields = ["user", "created_at"]




class NoteSerializer(serializers.ModelSerializer):


    class Meta:
        model = Note
        fields = "__all__"
        read_only_fields = ["user", "created_at", "updated_at"]

class SaveLaterSerializer(serializers.ModelSerializer):
    resource_detail = ResourceSerializer(source='resource', read_only=True)

    class Meta:
        model = SaveLater
        fields = "__all__"
        read_only_fields = ["user", "added_at"]
class SubjectSerializer(serializers.ModelSerializer):
    total_time = serializers.IntegerField(read_only=True)
    class Meta:
        model = Subject
        fields = "__all__"
        read_only_fields = ["user"]


class StudySessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudySession
        fields = "__all__"
        read_only_fields = ["user", "date"]


class PomodoroSerializer(serializers.ModelSerializer):
    class Meta:
        model = PomodoroSession
        fields = "__all__"
        read_only_fields = ["user", "created_at"]