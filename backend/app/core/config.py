from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file='.env', env_file_encoding='utf-8', extra='ignore')

    app_name: str = 'CorpBoard API'
    secret_key: str = Field(default='change-me', alias='SECRET_KEY')
    access_token_expire_minutes: int = Field(default=60, alias='ACCESS_TOKEN_EXPIRE_MINUTES')
    database_url: str = Field(default='sqlite+aiosqlite:///./app.db', alias='DATABASE_URL')
    upload_dir: str = Field(default='./uploads', alias='UPLOAD_DIR')
    cors_origins: str = Field(default='http://localhost:5173', alias='CORS_ORIGINS')
    seed_test_data: bool = Field(default=True, alias='SEED_TEST_DATA')

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(',') if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
