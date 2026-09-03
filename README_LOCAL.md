# Farm-Craft — Local Development

## 1. PostgreSQL
Create a PostgreSQL database named `farmcraft_db` and make sure the credentials in `backend/.env` match your local PostgreSQL user/password.

## 2. Backend
Open a terminal in `backend`:

```powershell
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

Check:
`http://127.0.0.1:8000/api/health`

## 3. Admin
Open a second terminal:

```powershell
cd admin
npm install
npm run dev
```

Admin: `http://localhost:5173`

Demo login:
- Email: `admin@farmcraft.com`
- Password: `admin123`

The Admin Vite dev server proxies `/api` to the backend on port 8000.

## 4. Customer
Open a third terminal:

```powershell
cd customer
npm install
npm run dev
```

Customer: `http://localhost:5174`

Customer login:
- Enter any valid-looking email
- Demo OTP: `1234`

The Customer Vite dev server proxies `/api` to the backend on port 8000.

## Important
The backend must be running before Admin/Customer API operations can work. If you see a "Could not reach the Farm Craft server" message, check that the backend terminal is running on port 8000.
