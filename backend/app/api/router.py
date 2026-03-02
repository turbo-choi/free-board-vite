from fastapi import APIRouter

from app.api.audit_logs import router as audit_logs_router
from app.api.attachments import router as attachments_router
from app.api.auth import router as auth_router
from app.api.boards import router as boards_router
from app.api.comments import router as comments_router
from app.api.menu_categories import router as menu_categories_router
from app.api.menus import router as menus_router
from app.api.posts import router as posts_router
from app.api.stats import router as stats_router
from app.api.users import router as users_router

api_router = APIRouter(prefix='/api')
api_router.include_router(audit_logs_router)
api_router.include_router(auth_router)
api_router.include_router(boards_router)
api_router.include_router(posts_router)
api_router.include_router(comments_router)
api_router.include_router(attachments_router)
api_router.include_router(menus_router)
api_router.include_router(menu_categories_router)
api_router.include_router(users_router)
api_router.include_router(stats_router)
