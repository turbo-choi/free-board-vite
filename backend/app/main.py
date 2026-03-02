from contextlib import asynccontextmanager
from time import perf_counter

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.core.config import settings
from app.core.database import AsyncSessionLocal, init_db
from app.core.exceptions import install_exception_handlers
from app.services.audit_logger import should_audit, write_audit_log
from app.services.seed import seed_initial_data
from app.services.timestamp_migration import migrate_utc_timestamps_to_system_time


@asynccontextmanager
async def lifespan(_: FastAPI):
    settings.validate_runtime_security()
    await init_db()
    async with AsyncSessionLocal() as session:
        await seed_initial_data(session)
        await migrate_utc_timestamps_to_system_time(session)
    yield


app = FastAPI(title=settings.app_name, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=settings.cors_allow_credentials,
    allow_methods=['*'],
    allow_headers=['*'],
)

install_exception_handlers(app)
app.include_router(api_router)


@app.middleware('http')
async def audit_log_middleware(request: Request, call_next):
    if not should_audit(request.url.path):
        return await call_next(request)

    started = perf_counter()
    status_code = 500
    try:
        response = await call_next(request)
        status_code = response.status_code
        return response
    finally:
        elapsed_ms = int((perf_counter() - started) * 1000)
        try:
            await write_audit_log(request, status_code=status_code, latency_ms=elapsed_ms)
        except Exception:
            # Audit logging failure should not break user requests.
            pass


@app.get('/health')
async def health() -> dict[str, str]:
    return {'status': 'ok'}
