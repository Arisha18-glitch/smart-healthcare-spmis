import os
import sqlite3
from typing import Generator

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "spm.db")
SCHEMA_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "schema.sql")

def get_db(db_path: str = None) -> sqlite3.Connection:
    """Returns a SQLite connection with row factory and foreign keys enabled."""
    target_path = db_path if db_path is not None else DB_PATH
    conn = sqlite3.connect(target_path, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn

def init_db(db_path: str = None) -> None:
    """Initializes the database schema."""
    target_path = db_path if db_path is not None else DB_PATH
    with open(SCHEMA_PATH, "r", encoding="utf-8") as f:
        schema_sql = f.read()
    
    conn = get_db(target_path)
    try:
        conn.executescript(schema_sql)
        conn.commit()
    finally:
        conn.close()

def get_db_session():
    """FastAPI dependency for database session."""
    conn = get_db()
    try:
        yield conn
    finally:
        conn.close()
