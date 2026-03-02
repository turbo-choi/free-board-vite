from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse


class AppException(Exception):
    def __init__(self, message: str, code: str, status_code: int = 400) -> None:
        self.message = message
        self.code = code
        self.status_code = status_code
        super().__init__(message)



def _error_payload(message: str, code: str) -> dict[str, str]:
    return {'message': message, 'code': code}



def install_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(AppException)
    async def handle_app_exception(_: Request, exc: AppException) -> JSONResponse:
        return JSONResponse(status_code=exc.status_code, content=_error_payload(exc.message, exc.code))

    @app.exception_handler(RequestValidationError)
    async def handle_validation_exception(_: Request, exc: RequestValidationError) -> JSONResponse:
        detail = exc.errors()[0].get('msg', 'Invalid request') if exc.errors() else 'Invalid request'
        return JSONResponse(status_code=422, content=_error_payload(detail, 'VALIDATION_ERROR'))

    @app.exception_handler(HTTPException)
    async def handle_http_exception(_: Request, exc: HTTPException) -> JSONResponse:
        detail = exc.detail if isinstance(exc.detail, str) else 'Request failed'
        return JSONResponse(
            status_code=exc.status_code,
            content=_error_payload(detail, f'HTTP_{exc.status_code}'),
        )

    @app.exception_handler(Exception)
    async def handle_unexpected_exception(_: Request, __: Exception) -> JSONResponse:
        return JSONResponse(
            status_code=500,
            content=_error_payload('Internal server error', 'INTERNAL_SERVER_ERROR'),
        )
