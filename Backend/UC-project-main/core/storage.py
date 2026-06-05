from cloudinary_storage.storage import MediaCloudinaryStorage

class AutoMediaCloudinaryStorage(MediaCloudinaryStorage):
    def _get_resource_type(self, name):
        # Allow Cloudinary to automatically detect if it's an image, video, or raw document
        return 'auto'
