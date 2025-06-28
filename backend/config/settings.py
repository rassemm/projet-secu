import os

DATABASE_CONFIG = {
    'dbname': os.getenv('DB_NAME', 'vulnerability_scanner.db'),
    'user': os.getenv('DB_USER', ''),
    'password': os.getenv('DB_PASSWORD', ''),
    'host': os.getenv('DB_HOST', ''),
    'port': os.getenv('DB_PORT', ''),
    'database_initialized': False,
    'use_sqlite': True
}

API_CONFIG = {
    'HOST': os.getenv('HOST', 'localhost'),
    'PORT': os.getenv('PORT', 5000),
    'DEBUG': os.getenv('DEBUG', True)
}

REDIS_CONFIG = {
    'HOST': os.getenv('REDIS_HOST', 'localhost'),
    'PORT': os.getenv('REDIS_PORT', 6379)
}