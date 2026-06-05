from django.shortcuts import render

from django.http import JsonResponse, FileResponse, Http404
from django.views.decorators.csrf import csrf_exempt
# from django.contrib.auth.models import User
from core.models import User
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.db.models import Q
import json
from rest_framework import viewsets, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.authtoken.models import Token
from .models import Resource, Folder, Note, SaveLater, TrashItem, ReadingHistory, Subject, StudySession, PomodoroSession
from .serializers import UserSerializer, ResourceSerializer, FolderSerializer, NoteSerializer, SaveLaterSerializer, SubjectSerializer, StudySessionSerializer, PomodoroSerializer
from django.db.models import Sum
@api_view(["GET", "PATCH"])
@permission_classes([permissions.IsAuthenticated])
def profile_view(request):
    user = request.user
    if request.method == "GET":
        serializer = UserSerializer(user)
        return JsonResponse(serializer.data)
    
    elif request.method == "PATCH":
        serializer = UserSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return JsonResponse(serializer.data)
        return JsonResponse(serializer.errors, status=400)
from django.utils import timezone
from datetime import timedelta


@csrf_exempt
def signup_view(request):

    if request.method != "POST":
        return JsonResponse({"error": "POST required"}, status=400)

    data = json.loads(request.body)

    username = data.get("username")
    email = data.get("email")
    password = data.get("password")

    if User.objects.filter(username=username).exists():
        return JsonResponse({"error": "Username already exists"}, status=400)

    user = User.objects.create_user(
        username=username,
        email=email,
        password=password
    )

    token, created = Token.objects.get_or_create(user=user)

    return JsonResponse({
        "message": "User created successfully",
        "user_id": user.id,
        "token": token.key
    })

@csrf_exempt
def login_view(request):

    if request.method != "POST":
        return JsonResponse({"error": "POST required"}, status=400)

    data = json.loads(request.body)

    username = data.get("username")
    password = data.get("password")

    user_obj = User.objects.filter(Q(username=username) | Q(email=username)).first()
    if user_obj:
        user = authenticate(username=user_obj.username, password=password)
    else:
        user = None

    if user is None:
        return JsonResponse({"error": "Invalid credentials"}, status=401)

    login(request, user)
    token, created = Token.objects.get_or_create(user=user)

    return JsonResponse({
        "message": "Login successful",
        "user_id": user.id,
        "token": token.key
    })

@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def logout_view(request):
    if hasattr(request.user, 'auth_token'):
        request.user.auth_token.delete()
    logout(request)
    return JsonResponse({
        "message": "Logged out successfully"
    })



def _cleanup_trash(user):
    if getattr(user, 'auto_empty_bin', False):
        days = getattr(user, 'auto_empty_days', 30)
        # Expiration is based on days selected by the user
        expiration_threshold = timezone.now() - timedelta(days=days)
        expired_items = TrashItem.objects.filter(user=user, deleted_at__lt=expiration_threshold)
        for item in expired_items:
            if item.type == 'resource':
                Resource.objects.filter(id=item.item_id).delete()
            elif item.type == 'folder':
                Folder.objects.filter(id=item.item_id).delete()
        expired_items.delete()

@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def dashboard(request):
    _cleanup_trash(request.user)
    # Exclude trashed items
    trashed_resource_ids = TrashItem.objects.filter(user=request.user, type='resource').values_list('item_id', flat=True)
    resources = Resource.objects.filter(user=request.user).exclude(id__in=trashed_resource_ids)
    
    trashed_folder_ids = TrashItem.objects.filter(user=request.user, type='folder').values_list('item_id', flat=True)
    folders_count = Folder.objects.filter(user=request.user).exclude(id__in=trashed_folder_ids).count()

    # Statistics
    total_resources = resources.count()
    
    # Calculate reading time from Focus activity log
    total_study_minutes = StudySession.objects.filter(user=request.user).aggregate(Sum('duration'))['duration__sum'] or 0
    hours = int(total_study_minutes // 60)
    minutes = int(total_study_minutes % 60)
    reading_time_str = f"{hours}h {minutes}m"

    # Calculate Streaks
    from datetime import date, timedelta
    study_dates = StudySession.objects.filter(user=request.user).values_list('date', flat=True).distinct().order_by('-date')
    streak = 0
    current_date = date.today()
    date_list = list(study_dates)
    if date_list:
        if date_list[0] == current_date or date_list[0] == current_date - timedelta(days=1):
            check_date = date_list[0]
            for d in date_list:
                if d == check_date:
                    streak += 1
                    check_date -= timedelta(days=1)
                else:
                    break

    # Progress: Read vs Total
    read_resources = resources.filter(reading_status='studied').count()
    progress_val = int((read_resources / total_resources * 100)) if total_resources > 0 else 0
    progress_str = f"{progress_val}%"

    # Serialize resources
    serializer = ResourceSerializer(resources, many=True)

    return JsonResponse({
        "user_name": request.user.full_name or request.user.username,
        "resources": serializer.data,
        "stats": {
            "total_resources": total_resources,
            "total_folders": folders_count,
            "reading_time": reading_time_str,
            "streaks": streak,
            "progress": progress_str
        }
    }, safe=False)


class ResourceViewSet(viewsets.ModelViewSet):
    serializer_class = ResourceSerializer
    permission_classes = [permissions.IsAuthenticated]


    def get_queryset(self):
        _cleanup_trash(self.request.user)
        trashed_ids = TrashItem.objects.filter(user=self.request.user, type='resource').values_list('item_id', flat=True)
        qs = Resource.objects.filter(user=self.request.user)
        if self.request.query_params.get('trashed') == 'true':
            return qs.filter(id__in=trashed_ids)
        return qs.exclude(id__in=trashed_ids)


    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
        
    def perform_destroy(self, instance):
        days = getattr(self.request.user, 'auto_empty_days', 30)
        TrashItem.objects.get_or_create(
            user=self.request.user,
            item_id=instance.id,
            type='resource',
            # Expiration is based on days selected by the user
            defaults={'expires_at': timezone.now() + timedelta(days=days)}
        )




class FolderViewSet(viewsets.ModelViewSet):
    serializer_class = FolderSerializer
    permission_classes = [permissions.IsAuthenticated]


    def get_queryset(self):
        _cleanup_trash(self.request.user)
        trashed_ids = TrashItem.objects.filter(user=self.request.user, type='folder').values_list('item_id', flat=True)
        qs = Folder.objects.filter(user=self.request.user)
        if self.request.query_params.get('trashed') == 'true':
            return qs.filter(id__in=trashed_ids)
        return qs.exclude(id__in=trashed_ids)


    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
        
    def perform_destroy(self, instance):
        days = getattr(self.request.user, 'auto_empty_days', 30)
        TrashItem.objects.get_or_create(
            user=self.request.user,
            item_id=instance.id,
            type='folder',
            # Expiration is based on days selected by the user
            defaults={'expires_at': timezone.now() + timedelta(days=days)}
        )




class NoteViewSet(viewsets.ModelViewSet):
    serializer_class = NoteSerializer
    permission_classes = [permissions.IsAuthenticated]


    def get_queryset(self):
        queryset = Note.objects.filter(user=self.request.user)
        resource_id = self.request.query_params.get('resource_id')
        if resource_id:
            queryset = queryset.filter(resource_id=resource_id)
        return queryset


    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class SaveLaterViewSet(viewsets.ModelViewSet):
    serializer_class = SaveLaterSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return SaveLater.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def restore_trash(request):
    item_id = request.data.get('item_id')
    item_type = request.data.get('type')
    TrashItem.objects.filter(user=request.user, item_id=item_id, type=item_type).delete()
    return JsonResponse({"status": "restored"})

@api_view(["POST", "DELETE"])
@permission_classes([permissions.IsAuthenticated])
def permanent_delete_trash(request):
    item_id = request.data.get('item_id')
    item_type = request.data.get('type')
    TrashItem.objects.filter(user=request.user, item_id=item_id, type=item_type).delete()
    if item_type == 'resource':
        Resource.objects.filter(user=request.user, id=item_id).delete()
    elif item_type == 'folder':
        Folder.objects.filter(user=request.user, id=item_id).delete()
    return JsonResponse({"status": "deleted permanently"})
from django.db.models.functions import Coalesce

class SubjectViewSet(viewsets.ModelViewSet):
    serializer_class = SubjectSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Subject.objects.filter(user=self.request.user).annotate(
            total_time=Coalesce(Sum('studysession__duration'), 0)
        )

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
class StudySessionViewSet(viewsets.ModelViewSet):
    serializer_class = StudySessionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return StudySession.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def complete_pomodoro(request):
    duration = request.data.get("duration")

    PomodoroSession.objects.create(
        user=request.user,
        duration=duration,
        completed=True
    )

    return JsonResponse({"status": "saved"})
@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def toggle_focus(request):
    user = request.user
    user.is_focus_mode = not user.is_focus_mode
    user.save()

    return JsonResponse({
        "focus_mode": user.is_focus_mode
    })
@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def activity_calendar(request):
    subject_id = request.GET.get("subject_id")
    qs = StudySession.objects.filter(user=request.user)
    
    if subject_id:
        qs = qs.filter(subject_id=subject_id)

    data = qs.values("date") \
        .annotate(total_minutes=Sum("duration")) \
        .order_by("date")

    return JsonResponse(list(data), safe=False)


import os
import requests
from django.http import StreamingHttpResponse

@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def download_resource(request, pk):
    try:
        resource = Resource.objects.get(id=pk, user=request.user)
    except Resource.DoesNotExist:
        raise Http404("Resource not found")

    if not resource.file:
        return JsonResponse({"error": "No file available"}, status=400)

    file_name = resource.file.name.split("/")[-1]

    # Local file fallback (when running locally with DEBUG=True)
    try:
        local_path = resource.file.path
        if os.path.exists(local_path):
            response = FileResponse(open(local_path, "rb"), as_attachment=True)
            response["Content-Disposition"] = f'attachment; filename="{file_name}"'
            return response
    except NotImplementedError:
        pass # Remote storage (e.g., Cloudinary) does not support absolute paths

    # Remote file fetching (for Cloudinary/S3 in production)
    try:
        file_url = resource.file.url
        # Convert internal media URLs to absolute URLs if needed, but Cloudinary URLs are absolute
        if not file_url.startswith("http"):
            file_url = request.build_absolute_uri(file_url)
            
        r = requests.get(file_url, stream=True)
        r.raise_for_status()

        response = StreamingHttpResponse(
            r.iter_content(chunk_size=8192), 
            content_type=r.headers.get('Content-Type', 'application/octet-stream')
        )
        response["Content-Disposition"] = f'attachment; filename="{file_name}"'
        return response
    except Exception as e:
        return JsonResponse({"error": f"File could not be retrieved: {str(e)}"}, status=404)