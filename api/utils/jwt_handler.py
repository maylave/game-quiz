import hmac
import hashlib
import json
import base64
import time
from typing import Optional, Dict, Any


class JWTHandler:
    def __init__(self, secret_key: str, algorithm: str = "HS256"):
        self.secret_key = secret_key.encode("utf-8")
        self.algorithm = algorithm

    def _base64url_encode(self, data: bytes) -> str:
        return base64.urlsafe_b64encode(data).rstrip(b'=').decode('utf-8')

    def _base64url_decode(self, data: str) -> bytes:
        padding = 4 - len(data) % 4
        if padding != 4:
            data += "=" * padding
        return base64.urlsafe_b64decode(data)

    def create_token(self, payload: Dict[str, Any], expires_in: int = 3000) -> str:
        header = {"alg": self.algorithm, "typ": "JWT"}
        token_payload = payload.copy()

        current_time = int(time.time())
        token_payload["iat"] = current_time
        token_payload["exp"] = current_time + expires_in

        header_encoded = self._base64url_encode(
            json.dumps(header, separators=(',', ':')).encode('utf-8')
        )
        payload_encoded = self._base64url_encode(
            json.dumps(token_payload, separators=(',', ':')).encode('utf-8')
        )

        message = f"{header_encoded}.{payload_encoded}"
        signature = hmac.new(
            self.secret_key, msg=message.encode('utf-8'), digestmod=hashlib.sha256
        ).digest()

        return f"{header_encoded}.{payload_encoded}.{self._base64url_encode(signature)}"

    def verify_token(self, token: str) -> Optional[Dict[str, Any]]:
        try:
            parts = token.split('.')
            if len(parts) != 3:
                return None

            header_encoded, payload_encoded, signature_encoded = parts

            # Проверка подписи
            message = f"{header_encoded}.{payload_encoded}"
            expected_sig = hmac.new(
                self.secret_key, msg=message.encode('utf-8'), digestmod=hashlib.sha256
            ).digest()

            if not hmac.compare_digest(expected_sig, self._base64url_decode(signature_encoded)):
                return None

            # Декодирование и проверка времени
            payload = json.loads(self._base64url_decode(payload_encoded))
            if "exp" in payload and int(time.time()) >= payload["exp"]:
                return None

            return payload
        except Exception:
            return None
