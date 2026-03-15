import sqlite3

def list_shoots():
    db_path = "c:/Dev/Krishna/real-estate-media/backend/db.sqlite3"
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("SELECT id, property_address, payment_status FROM api_clientshoot")
    rows = cursor.fetchall()
    print("Shoots in database:")
    for r in rows:
        print(f"ID: {r[0]}, Address: {r[1]}, Payment: {r[2]}")
    conn.close()

if __name__ == "__main__":
    list_shoots()
