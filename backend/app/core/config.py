from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file='.env', env_file_encoding='utf-8', extra='ignore')

    app_name: str = 'CorpBoard API'
    app_env: str = Field(default='development', alias='APP_ENV')
    secret_key: str = Field(default='change-me', alias='SECRET_KEY')
    default_admin_password: str = Field(default='admin1234', alias='DEFAULT_ADMIN_PASSWORD')
    access_token_expire_minutes: int = Field(default=60, alias='ACCESS_TOKEN_EXPIRE_MINUTES')
    database_url: str = Field(default='sqlite+aiosqlite:///./app.db', alias='DATABASE_URL')
    upload_dir: str = Field(default='./uploads', alias='UPLOAD_DIR')
    max_upload_size_mb: int = Field(default=25, alias='MAX_UPLOAD_SIZE_MB')
    cors_origins: str = Field(default='http://localhost:5173', alias='CORS_ORIGINS')
    cors_allow_credentials: bool = Field(default=True, alias='CORS_ALLOW_CREDENTIALS')
    seed_test_data: bool = Field(default=True, alias='SEED_TEST_DATA')
    login_max_attempts: int = Field(default=5, alias='LOGIN_MAX_ATTEMPTS')
    login_attempt_window_seconds: int = Field(default=300, alias='LOGIN_ATTEMPT_WINDOW_SECONDS')
    login_lock_seconds: int = Field(default=300, alias='LOGIN_LOCK_SECONDS')
    login_max_tracked_keys: int = Field(default=10000, alias='LOGIN_MAX_TRACKED_KEYS')

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(',') if origin.strip()]

    @property
    def is_production(self) -> bool:
        return self.app_env.strip().lower() in {'prod', 'production'}

    def validate_runtime_security(self) -> None:
        weak_secrets = {'', 'change-me', 'changeme', 'default', 'secret'}
        weak_admin_passwords = {'', 'admin', 'admin1234', 'password', '12345678', 'qwerty123'}

        if self.max_upload_size_mb <= 0:
            raise RuntimeError('MAX_UPLOAD_SIZE_MB must be greater than 0')
        if self.login_max_attempts <= 0:
            raise RuntimeError('LOGIN_MAX_ATTEMPTS must be greater than 0')
        if self.login_attempt_window_seconds <= 0:
            raise RuntimeError('LOGIN_ATTEMPT_WINDOW_SECONDS must be greater than 0')
        if self.login_lock_seconds <= 0:
            raise RuntimeError('LOGIN_LOCK_SECONDS must be greater than 0')
        if self.login_max_tracked_keys <= 0:
            raise RuntimeError('LOGIN_MAX_TRACKED_KEYS must be greater than 0')

        if self.is_production:
            if self.secret_key.strip().lower() in weak_secrets:
                raise RuntimeError('In production, SECRET_KEY must be set to a strong non-default value.')
            if self.default_admin_password.strip().lower() in weak_admin_passwords:
                raise RuntimeError(
                    'In production, DEFAULT_ADMIN_PASSWORD must be changed from weak defaults.'
                )
            if self.cors_allow_credentials and any(origin == '*' for origin in self.cors_origin_list):
                raise RuntimeError(
                    "CORS_ORIGINS must not contain '*' when CORS_ALLOW_CREDENTIALS is true."
                )


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
