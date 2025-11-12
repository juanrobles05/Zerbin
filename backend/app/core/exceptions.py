from fastapi import Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
import logging

logger = logging.getLogger(__name__)


async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """
    Manejador global de errores de validación de Pydantic.
    Formatea los errores de validación para que sean más amigables.
    """
    errors = exc.errors()
    formatted_errors = []

    for error in errors:
        field = error['loc'][-1] if error['loc'] else 'unknown'
        msg = error['msg']
        error_type = error['type']

        # Mensajes personalizados según el campo
        if 'email' in str(field).lower():
            if 'value_error' in error_type or 'email' in error_type:
                formatted_errors.append("El email ingresado no tiene un formato válido")
            else:
                formatted_errors.append(f"Email: {msg}")
        elif 'password' in str(field).lower():
            if 'string_too_short' in error_type:
                formatted_errors.append("La contraseña debe tener al menos 6 caracteres")
            else:
                formatted_errors.append(f"Contraseña: {msg}")
        elif 'username' in str(field).lower():
            if 'string_too_short' in error_type:
                formatted_errors.append("El nombre de usuario debe tener al menos 3 caracteres")
            elif 'string_too_long' in error_type:
                formatted_errors.append("El nombre de usuario no puede superar 50 caracteres")
            else:
                formatted_errors.append(f"Nombre de usuario: {msg}")
        else:
            formatted_errors.append(f"{field}: {msg}")

    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={
            "detail": formatted_errors[0] if len(formatted_errors) == 1 else formatted_errors,
        }
    )


def register_exception_handlers(app):
    """
    Registra todos los manejadores de excepciones en la aplicación.
    """
    app.add_exception_handler(RequestValidationError, validation_exception_handler)