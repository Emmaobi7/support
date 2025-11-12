from agora_token_builder import RtcTokenBuilder
from datetime import datetime, timedelta
from typing import Optional
import time

from app.models import AgoraTokenRequest, AgoraTokenResponse
from app.core.config import settings

class AgoraService:
    """Service for managing Agora tokens and screen sharing."""
    
    def __init__(self, app_id: str, app_certificate: str):
        self.app_id = app_id
        self.app_certificate = app_certificate
    
    def generate_token(
        self, 
        channel_name: str, 
        uid: int = 0, 
        role: int = 1,
        privilege_expired_ts: Optional[int] = None
    ) -> AgoraTokenResponse:
        """
        Generate Agora RTC token for screen sharing.
        
        Args:
            channel_name: Name of the Agora channel
            uid: User ID (0 for auto-assignment)
            role: User role (1 for publisher, 2 for subscriber)
            privilege_expired_ts: Token expiration timestamp
            
        Returns:
            AgoraTokenResponse with token and metadata
        """
        if not self.app_certificate:
            raise ValueError("Agora app certificate not configured")
        
        # Default expiration time (24 hours from now)
        if privilege_expired_ts is None:
            privilege_expired_ts = int(time.time()) + 24 * 3600
        
        # Generate the token
        token = RtcTokenBuilder.buildTokenWithUid(
            self.app_id,
            self.app_certificate,
            channel_name,
            uid,
            role,
            privilege_expired_ts
        )
        
        # Convert timestamp to datetime
        expires_at = datetime.fromtimestamp(privilege_expired_ts)
        
        return AgoraTokenResponse(
            token=token,
            channel_name=channel_name,
            uid=uid,
            expires_at=expires_at
        )
    
    def validate_channel_name(self, channel_name: str) -> bool:
        """
        Validate channel name according to Agora requirements.
        
        Args:
            channel_name: Channel name to validate
            
        Returns:
            True if valid, False otherwise
        """
        # Agora channel name requirements:
        # - ASCII letters, numbers, underscore, hyphen
        # - 1-64 characters
        import re
        pattern = r'^[a-zA-Z0-9_-]{1,64}$'
        return bool(re.match(pattern, channel_name))

# Global service instance
agora_service = AgoraService(
    app_id=settings.agora_app_id or "",
    app_certificate=settings.agora_app_certificate or ""
)