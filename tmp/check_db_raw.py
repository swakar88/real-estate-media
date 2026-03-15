import sqlite3

def check_shoot():
    db_path = "c:/Dev/Krishna/real-estate-media/backend/db.sqlite3"
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # We need to find the table name. It's usually api_clientshoot.
    try:
        cursor.execute("SELECT id, property_address, status, payment_status FROM api_clientshoot WHERE id=7")
        row = cursor.fetchone()
        if row:
            print(f"ID: {row[0]}, Address: {row[1]}, Status: {row[2]}, Payment: {row[3]}")
        else:
            print("Shoot 7 not found.")
            
        # Also check all shoots to see if there's any case mismatch in names
        cursor.execute("SELECT DISTINCT payment_status FROM api_clientshoot")
        statuses = cursor.fetchall()
        print(f"All observed payment statuses: {statuses}")
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    check_shoot()
