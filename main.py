import pymysql
import os

from mangum import Mangum
from fastapi import FastAPI, Request, Form, Depends, UploadFile, File
from fastapi.responses import HTMLResponse, RedirectResponse, JSONResponse
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

@app.get("/users_crud", response_class=HTMLResponse)
async def read_users_crud(request: Request):
    return templates.TemplateResponse("users_crud.html", {"request": request})

@app.get("/", response_class=HTMLResponse)
async def read_main(request: Request):
    return templates.TemplateResponse("main.html", {"request": request})

@app.get("/login", response_class=HTMLResponse)
async def read_login(request: Request):
    return templates.TemplateResponse("login.html", {"request": request})

@app.get("/sign_up", response_class=HTMLResponse)
async def read_register(request: Request):
    return templates.TemplateResponse("sign_up.html", {"request": request})

@app.get("/tickets", response_class=HTMLResponse)
async def read_register(request: Request):
    return templates.TemplateResponse("tickets.html", {"request": request})

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
    name: str = Form(...),
    surname: str = Form(...),
    email: str = Form(...),
    cpf: str = Form(...),
    phone: str = Form(...),
    cep: str = Form(...),
    address: str = Form(...),
    observation: str = Form(None), # None lets the field be null
    password: str = Form(...),
    db=Depends(get_db)
):
    NameSurname = f"{name} {surname}"
    Username = email
    Email = email
    CPF = cpf.replace('.', '').replace('-', '')
    CEP = cep.replace('-', '').replace('.', '')
    Number = phone.replace('(', '').replace(')', '').replace('-', '').replace(' ', '')

    Address = address
    Complement = observation
    Password = password

    try:
        with db.cursor() as cursor:
            # Checks if the username or email are already in use, if so returns an error menssage
            cursor.execute("SELECT * FROM User WHERE Username = %s OR Email = %s", (Username, Email))
            existing_user = cursor.fetchone()


            if existing_user:
                error_message = "Username or email already in use."
                return templates.TemplateResponse("sign_up.html", {"request": request, "error": error_message})

            #Inserts into each table according to indepence

            # First, insert the user into the User table
            cursor.execute(
                "INSERT INTO User (Username, Email, NameSurname, CPF, Number, CEP, Password) VALUES (%s, %s, %s, %s, %s, %s, %s)",
                (Username, Email, NameSurname, CPF, Number, CEP, Password)
            )
            user_id = cursor.lastrowid
            db.commit()

            # Now, insert the address into the Address table, referencing the User
            cursor.execute("INSERT INTO Address (Address, fk_User_idUser) VALUES (%s, %s)", (Address, user_id))
            address_id = cursor.lastrowid
            db.commit()

            #Inserts the complement into the DB if it exits

            complement_id = None
            if Complement:
                 cursor.execute("INSERT INTO Complement (Complement, fk_User_idUser) VALUES (%s, %s)", (Complement, user_id))
                 complement_id = cursor.lastrowid
                 db.commit()

            return RedirectResponse("/login", status_code=302)

    # Rollback safeguards for duplicate or incorrect entries
    except pymysql.err.IntegrityError as ie:
        db.rollback()
        print(f"Integrity error during sign up: {ie}")
        error_message = "Registration failed due to data conflict (e.g., duplicate entry or invalid foreign key)."
        return templates.TemplateResponse("sign_up.html", {"request": request, "error": error_message})
    except Exception as e:
        db.rollback()
        print(f"Error during sign up: {e}")
        error_message = "An error occurred during registration."
        return templates.TemplateResponse("sign_up.html", {"request": request, "error": error_message})
    finally:
        db.close()

@app.get("/delete_user")
async def delete_user(
    user_id: int,
    db=Depends(get_db)
):
    try:
        with db.cursor() as cursor:
            # Deleta os registros relacionados na tabela IssueHistory
            cursor.execute("DELETE FROM IssueHistory WHERE fk_ChangedByUser = %s", (user_id,))
            db.commit()

            # Deleta os registros relacionados na tabela Issue
            cursor.execute("DELETE FROM Issue WHERE fk_User_idUser = %s", (user_id,))
            db.commit()

            # Deleta os registros relacionados na tabela Address
            cursor.execute("DELETE FROM Address WHERE fk_User_idUser = %s", (user_id,))
            db.commit()

            # Deleta os registros relacionados na tabela Complement
            cursor.execute("DELETE FROM Complement WHERE fk_User_idUser = %s", (user_id,))
            db.commit()

            # Deleta o usuário da tabela User
            cursor.execute("DELETE FROM User WHERE idUser = %s", (user_id,))
            db.commit()

            return RedirectResponse("/users_crud", status_code=302)
    except Exception as e:
        print(f"Error deleting user: {e}")
        return JSONResponse(content={"error": "Failed to delete user"}, status_code=500)
    finally:
        db.close()
        
@app.post("/edit_user")
#algum dia isso aqui vai funcionar

@app.get("/users", response_class=JSONResponse)
async def get_users(db=Depends(get_db)):
    try:
        with db.cursor() as cursor:
            # Consulta todos os usuários da tabela User
            cursor.execute("SELECT idUser, Username, Email, NameSurname, CPF, Number, CEP FROM User")
            users = cursor.fetchall()

            # Mapeia os resultados para um formato JSON
            result = [
                {
                    "idUser": user[0],
                    "Username": user[1],
                    "Email": user[2],
                    "NameSurname": user[3],
                    "CPF": user[4],
                    "Number": user[5],
                    "CEP": user[6],
                    "Complement": user[7],
                }
                for user in users
            ]
            return result
    except Exception as e:
        print(f"Error fetching users: {e}")
        return JSONResponse(content={"error": "Failed to fetch users"}, status_code=500)
    finally:
        db.close()

if __name__ == "__main__":
    import uvicorn  
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)