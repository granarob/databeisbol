"""
image_upload.py
───────────────
Lógica centralizada para optimizar y subir imágenes a Supabase Storage.

Carpetas en el bucket:
  - jugadores/  → fotos de peloteros (Player.photo)
  - logos/      → logos de equipos y ligas (Team.logo / League.logo)

Optimización (Pillow):
  - Redimensiona a máx. 800 px (ancho o alto, manteniendo proporción)
  - Convierte a WebP con calidad 75%
  - Nombre normalizado: slugify(nombre) + ".webp"
"""

import io
import re
import unicodedata

from django.conf import settings
from PIL import Image
from supabase import create_client, Client


# ─── Cliente (singleton lazy) ─────────────────────────────────────
_supabase_client: Client | None = None


def _get_client() -> Client:
    global _supabase_client
    if _supabase_client is None:
        url  = getattr(settings, "SUPABASE_URL",  "")
        key  = getattr(settings, "SUPABASE_SERVICE_KEY", "")
        if not url or not key:
            raise ValueError(
                "Faltan SUPABASE_URL o SUPABASE_SERVICE_KEY en settings/env."
            )
        _supabase_client = create_client(url, key)
    return _supabase_client


# ─── Helpers ──────────────────────────────────────────────────────
def _slugify(text: str) -> str:
    """Convierte texto a slug seguro para URLs: 'Léones Del Valle' → 'leones-del-valle'"""
    text = unicodedata.normalize("NFKD", text)
    text = text.encode("ascii", "ignore").decode("ascii")
    text = re.sub(r"[^\w\s-]", "", text).strip().lower()
    return re.sub(r"[\s_-]+", "-", text)


def _optimize_image(image_file, max_px: int = 800, quality: int = 75) -> bytes:
    """
    Abre la imagen, la redimensiona y la convierte a WebP.
    Devuelve los bytes resultantes.
    """
    img = Image.open(image_file)

    # Convertir a RGB si es RGBA/P (necesario para WebP sin transparencia)
    if img.mode in ("RGBA", "P"):
        img = img.convert("RGBA")
    else:
        img = img.convert("RGB")

    # Redimensionar manteniendo proporción
    img.thumbnail((max_px, max_px), Image.LANCZOS)

    buffer = io.BytesIO()
    img.save(buffer, format="WEBP", quality=quality, method=6)
    return buffer.getvalue()


# ─── Función principal ────────────────────────────────────────────
def upload_image(
    image_file,
    name_hint: str,
    folder: str,
    bucket: str | None = None,
) -> str:
    """
    Optimiza y sube una imagen a Supabase Storage.

    Parámetros:
        image_file  : archivo Django (InMemoryUploadedFile o similar)
        name_hint   : string para generar el nombre del archivo (ej: "Leones del Valle")
        folder      : carpeta dentro del bucket ("jugadores" o "logos")
        bucket      : nombre del bucket (por defecto usa settings.SUPABASE_BUCKET)

    Devuelve:
        URL pública de la imagen subida.
    """
    bucket_name = bucket or getattr(settings, "SUPABASE_BUCKET", "databeisbol-assets")
    slug        = _slugify(name_hint) or "imagen"
    file_path   = f"{folder.strip('/')}/{slug}.webp"

    # 1. Optimizar imagen
    webp_bytes = _optimize_image(image_file)

    # 2. Subir a Supabase (upsert=True para sobreescribir si ya existe)
    client = _get_client()
    client.storage.from_(bucket_name).upload(
        path=file_path,
        file=webp_bytes,
        file_options={
            "content-type": "image/webp",
            "upsert": "true",
        },
    )

    # 3. Construir URL pública
    public_url = (
        f"{settings.SUPABASE_URL}/storage/v1/object/public/{bucket_name}/{file_path}"
    )
    return public_url
