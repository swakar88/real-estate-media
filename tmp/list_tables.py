import sqlite3

def list_tables():
    db_path = "c:/Dev/Krishna/real-estate-media/backend/db.sqlite3"
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = cursor.fetchall()
    print("Tables in database:")
    for t in tables:
        print(f"- {t[0]}")
    conn.close()

if __name__ == "__main__":
    list_tables()
