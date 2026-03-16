import requests

res = requests.post("http://127.0.0.1:8000/api/token/", json={"username": "admin", "password": "admin123"})
print(res.status_code)
print(res.json())

if res.ok:
    token = res.json()['access']
    me_res = requests.get("http://127.0.0.1:8000/api/me/", headers={"Authorization": f"Bearer {token}"})
    print(me_res.status_code)
    print(me_res.json())
