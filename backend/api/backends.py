from django.contrib.auth import get_user_model
from django.contrib.auth.backends import ModelBackend

class EmailBackend(ModelBackend):
    def authenticate(self, request, username=None, password=None, **kwargs):
        UserModel = get_user_model()
        try:
            # First, check if a user exists with this email
            user = UserModel.objects.get(email=username)
        except UserModel.DoesNotExist:
            try:
                # If not, try checking the username
                user = UserModel.objects.get(username=username)
            except UserModel.DoesNotExist:
                return None
        except UserModel.MultipleObjectsReturned:
            # If multiple users have the same email, get the active one
            user = UserModel.objects.filter(email=username, is_active=True).first()
            if not user:
                return None
        
        if user and user.check_password(password) and self.user_can_authenticate(user):
            return user
        return None
