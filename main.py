import pymysql
import os

from mangum import Mangum
from fastapi import FastAPI, Request, Form, Depends, UploadFile, File
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from starlette.middleware.sessions import SessionMiddleware

app = FastAPI()

# Configuração de sessão (chave secreta para cookies de sessão)
app.add_middleware(SessionMiddleware, secret_key="Syscall")
# Configuração de arquivos estáticos
app.mount("/static", StaticFiles(directory=os.path.join(os.path.dirname(__file__), "pages")), name="static")

# Configuração de templates Jinja2
templates = Jinja2Templates(directory=os.path.join(os.path.dirname(__file__), "pages/html"))

# Configuração do banco de dados
DB_CONFIG = {
    "host": "localhost",
    "user": "root",
    "password": "admin",
    "database": "SysCall"
}

def get_db():
    return pymysql.connect(**DB_CONFIG)


@app.get("/", response_class=HTMLResponse)
async def read_main(request: Request):
    return templates.TemplateResponse("main.html", {"request": request})

@app.get("/login", response_class=HTMLResponse)
async def read_login(request: Request):
    return templates.TemplateResponse("login.html", {"request": request})

@app.get("/sign_up", response_class=HTMLResponse)
async def read_register(request: Request):
    return templates.TemplateResponse("sign_up.html", {"request": request})

@app.post("/login")
async def login(
    request: Request,
    email: str = Form(...),
    password: str = Form(...),
    db=Depends(get_db)
):
    try:
        with db.cursor() as cursor:
            cursor.execute("SELECT * FROM User WHERE Email = %s AND Password = %s", (email, password))
            user = cursor.fetchone()

            if user:
                request.session["user_logged_in"] = True
                request.session["email"] = user[1]
                return RedirectResponse("/", status_code=302)
            else:
                error_message = "Email ou senha invalidos"
                return templates.TemplateResponse("login.html", {"request": request, "error": error_message})
    finally:
        db.close()


@app.post("/sign_up")
async def sign_up(
    request: Request,
    Username: str = Form(...),
    Email: str = Form(...),
    NameSurname: str = Form(...),
    CPF: int = Form(...),
    Number: int = Form(...),
    CEP: int = Form(...),
    Address: str = Form(...),
    Complement: str = Form(None),  # None lets the field be null
    Password: str = Form(...),
    db=Depends(get_db)
):
    try:
        with db.cursor() as cursor:
            # Checks if the username or email are already in use, if so returns an error menssage
            cursor.execute("SELECT * FROM User WHERE Username = %s OR Email = %s", (Username, Email))
            existing_user = cursor.fetchone()

            if existing_user:
                error_message = "Username or email already in use."
                return templates.TemplateResponse("sign_up.html", {"request": request, "error": error_message})

            #Inserts into each table according to indepence

            #Inserts the complement into the DB if it exits
            if Complement:
                cursor.execute("INSERT INTO Complement (Complement) VALUES (%s)", (Complement,))
                complement_id = cursor.lastrowid
                db.commit()
            else:
                complement_id = None

            # First, insert the user into the User table
            cursor.execute(
                "INSERT INTO User (Username, Email, NameSurname, CPF, Number, CEP, Complement, Password) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)",
                (Username, Email, NameSurname, CPF, Number, CEP, complement_id, Password)
            )
            user_id = cursor.lastrowid  # Get the newly generated user ID
            db.commit()

            # Now, insert the address into the Address table, referencing the User
            cursor.execute("INSERT INTO Address (Address, fk_Complement_idComplement, fk_User_idUser) VALUES (%s, %s, %s)", (Address, complement_id, user_id))
            address_id = cursor.lastrowid
            db.commit()

            # Redirect to login page
            return RedirectResponse("/login", status_code=302)

    # Handles unknown errors in the sign up process
    except Exception as e:
        print(f"Error during sign up: {e}")
        error_message = "An error occurred during registration."
        return templates.TemplateResponse("sign_up.html", {"request": request, "error": error_message})
    finally:
        db.close()



if __name__ == "__main__":
    import uvicorn  
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)