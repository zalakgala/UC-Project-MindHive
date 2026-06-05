from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    ResourceViewSet, FolderViewSet, NoteViewSet, SaveLaterViewSet,
    SubjectViewSet, StudySessionViewSet, complete_pomodoro, 
    toggle_focus, activity_calendar, download_resource
)
from . import views
from django.conf import settings
from django.conf.urls.static import static

router = DefaultRouter()
router.register(r'resources', ResourceViewSet, basename='resource')
router.register(r'folders', FolderViewSet, basename='folder')
router.register(r'notes', NoteViewSet, basename='note')
router.register(r'saved', SaveLaterViewSet, basename='savelater')
router.register(r'subjects', SubjectViewSet, basename='subject')
router.register(r'study-sessions', StudySessionViewSet, basename='studysession')


urlpatterns = [
    path('', include(router.urls)),
    path('dashboard/', views.dashboard, name='dashboard'),
    path('trash/restore/', views.restore_trash, name='restore_trash'),
    path('trash/permanent/', views.permanent_delete_trash, name='permanent_trash'),
    path('profile/', views.profile_view, name='profile'),
    path('pomodoro/', complete_pomodoro, name='complete_pomodoro'),
    path('focus-toggle/', toggle_focus, name='toggle_focus'),
    path('activity/', activity_calendar, name='activity_calendar'),
    path('download/<int:pk>/', download_resource, name='download_resource'),
]

urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)