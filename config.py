import os


class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'anan')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URI', 'sqlite:///data.db')

    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'another_secret_key')
    JWT_ACCESS_TOKEN_EXPIRES = 3600
    REMEMBER_COOKIE_DURATION = 86400



class DevelopmentConfig(Config):
    DEBUG = True 