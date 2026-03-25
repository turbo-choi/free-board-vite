from app.core.config import Settings


def test_cors_origin_list_splits_and_trims_values():
    settings = Settings(CORS_ORIGINS=' http://localhost:5173, https://corp.example.com ')

    assert settings.cors_origin_list == ['http://localhost:5173', 'https://corp.example.com']


def test_validate_runtime_security_rejects_invalid_login_limit():
    settings = Settings(LOGIN_MAX_ATTEMPTS=0)

    try:
        settings.validate_runtime_security()
    except RuntimeError as exc:
        assert str(exc) == 'LOGIN_MAX_ATTEMPTS must be greater than 0'
    else:
        raise AssertionError('Expected validate_runtime_security to reject invalid limits')
