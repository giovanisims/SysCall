import uvicorn  
import os
import hashlib
from typing import Optional, Annotated
import re

import pymysql
from pymysql import cursors
from fastapi import (
    FastAPI,
    Request,
    Form,
    Depends,
    HTTPException
)
from fastapi.responses import HTMLResponse, RedirectResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel, EmailStr, Field
from starlette.middleware.sessions import SessionMiddleware

DB_CONFIG = {
    # bash: export foo="bar"
    # cmd: setx foo "bar"
    # pwsh: [Environment]::SetEnvironmentVariable("foo", "bar", "User")
    'host': os.getenv('DB_HOST', 'localhost'),
    'port' : int(os.getenv('DB_PORT', '3306')),
    'user': os.getenv('DB_USER', 'root'),
    'password': os.getenv('DB_PASSWORD', 'admin'),
    'db': 'SysCall',
    'charset': 'utf8mb4',
    'cursorclass': cursors.DictCursor,
}

def get_db():
    return pymysql.connect(**DB_CONFIG) 

app = FastAPI()

# Configuração de sessão (chave secreta para cookies de sessão)
app.add_middleware(SessionMiddleware, secret_key="Syscall")

# Configuração de arquivos estáticos
static_dir = os.path.join(os.path.dirname(__file__), "pages")
if not os.path.exists(static_dir):
     # Handle case where directory might not exist yet or path is wrong
     print(f"Warning: Static directory not found at {static_dir}")
     # Decide how to handle this - maybe create it, or just proceed cautiously.
     # For now, we'll let the mount potentially fail if it doesn't exist.
     pass
app.mount("/static", StaticFiles(directory=static_dir), name="static")


# Configuração de templates Jinja2
templates_dir = os.path.join(os.path.dirname(__file__), "pages", "html")
if not os.path.exists(templates_dir):
    print(f"Warning: Templates directory not found at {templates_dir}")
    # Handle appropriately
    pass
templates = Jinja2Templates(directory=templates_dir)


@app.get("/users_crud", response_class=HTMLResponse)
async def read_users_crud(request: Request):
    user_name = request.session.get("user_name", None)
    return templates.TemplateResponse("users_crud.html", {"request": request, "user_name": user_name})

@app.get("/", response_class=HTMLResponse)
async def read_main(request: Request):
    # Obtém o nome do usuário da sessão
    user_name = request.session.get("user_name", None)
    return templates.TemplateResponse("main.html", {"request": request, "user_name": user_name})

@app.get("/login", response_class=HTMLResponse)
async def read_login(request: Request):
    return templates.TemplateResponse("login.html", {"request": request})

@app.get("/sign_up", response_class=HTMLResponse)
async def read_register(request: Request):
    return templates.TemplateResponse("sign_up.html", {"request": request})

@app.get("/tickets", response_class=HTMLResponse)
async def read_register(request: Request):
    user_name = request.session.get("user_name", None)
    return templates.TemplateResponse("tickets.html", {"request": request, "user_name": user_name})

@app.post("/login")
async def login(
    request: Request,
    email: str = Form(...),
    password: str = Form(...),
    db=Depends(get_db)
):
    try:
        # Hash da senha usando MD5
        hashed_password = hashlib.md5(password.encode()).hexdigest()
        with db.cursor() as cursor:
            cursor.execute("SELECT NameSurname FROM User WHERE Email = %s AND Password = %s", (email, hashed_password))
            user = cursor.fetchone()

            if user:
                # Armazena o nome do usuário na sessão
                request.session["user_name"] = user["NameSurname"]
                return RedirectResponse("/", status_code=302)
            else:
                error_message = "Email ou senha inválidos"
                return templates.TemplateResponse("login.html", {"request": request, "error": error_message})
    finally:
        db.close()
        
@app.get("/logout")
async def logout(request: Request):
    request.session.clear()
    return RedirectResponse("/", status_code=302)


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
    if not re.match("(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*\W).{8,}", password):
        return templates.TemplateResponse("signup.html", {"request": request, "error": "Password doesn't match the requirements"})

    NameSurname = f"{name} {surname}"
    Username = email
    Email = email
    CPF = cpf.replace('.', '').replace('-', '')
    CEP = cep.replace('-', '').replace('.', '')
    Number = phone.replace('(', '').replace(')', '').replace('-', '').replace(' ', '')

    Address = address
    Complement = observation

    # Hash the password using MD5
    Password = hashlib.md5(password.encode()).hexdigest()

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

# User reference model
class UserUpdate(BaseModel):
    Username: str
    NameSurname: str
    Email: EmailStr
    CPF: Annotated[str, Field(pattern=r'^\d{11}$')]
    Number: Annotated[str, Field(pattern=r'^\d{10,11}$')]
    CEP: Annotated[str, Field(pattern=r'^\d{8}$')]
    Address: Optional[str] = None
    Complement: Optional[str] = None

@app.get("/delete_user")
async def delete_user(
    user_id: int,
    db=Depends(get_db)
):
    try:
        with db.cursor() as cursor:
            # 1. Delete related records from Address
            cursor.execute("DELETE FROM Address WHERE fk_User_idUser = %s", (user_id,))
            db.commit()

            # 2. Delete related records from Complement
            cursor.execute("DELETE FROM Complement WHERE fk_User_idUser = %s", (user_id,))
            db.commit()

            # 3. Finally, delete the user
            cursor.execute("DELETE FROM User WHERE idUser = %s", (user_id,))
            db.commit()

            # Redirect back with a success flag
            return RedirectResponse("/users_crud?deleted=true", status_code=302)
    except Exception as e:
        db.rollback() # Rollback all changes if any step fails
        print(f"Error deleting user {user_id}: {e}")
        # Raise HTTPException which FastAPI/Starlette can handle
        # You might want a specific error page or message on the frontend
        raise HTTPException(status_code=500, detail=f"Failed to delete user: {e}")
    finally:
        if db:
            db.close()


@app.get("/users", response_class=JSONResponse)
async def get_users(db=Depends(get_db)):
    try:
        with db.cursor() as cursor:
            # Join User, Complement, and Address tables
            sql = """
                SELECT 
                    u.idUser, u.Username, u.Email, u.NameSurname, u.CPF, u.Number, u.CEP,
                    c.Complement, 
                    a.Address  
                FROM User u
                LEFT JOIN Complement c ON u.idUser = c.fk_User_idUser 
                LEFT JOIN Address a ON u.idUser = a.fk_User_idUser
            """
            cursor.execute(sql)
            users = cursor.fetchall()

            return users 
    except Exception as e:
        print(f"Error fetching users: {e}")
        return JSONResponse(content={"error": "Failed to fetch users"}, status_code=500)
    finally:
        if db:
            db.close()

@app.get("/user/{user_id}", response_class=JSONResponse)
async def get_user(user_id: int, db=Depends(get_db)):
    try:
        with db.cursor() as cursor:
            # Fetch user data along with address and complement
            sql = """
                SELECT 
                    u.idUser, u.Username, u.Email, u.NameSurname, u.CPF, u.Number, u.CEP,
                    a.Address, 
                    c.Complement
                FROM User u
                LEFT JOIN Address a ON u.idUser = a.fk_User_idUser
                LEFT JOIN Complement c ON u.idUser = c.fk_User_idUser
                WHERE u.idUser = %s
            """
            cursor.execute(sql, (user_id,))
            user = cursor.fetchone()
            if not user:
                raise HTTPException(status_code=404, detail="User not found") 
            return user
    except HTTPException as http_exc:
         raise http_exc # Re-raise HTTPException
    except Exception as e:
        print(f"Error fetching user {user_id}: {e}")
        # Return error as JSON for the frontend to handle
        return JSONResponse(content={"error": f"Failed to fetch user data: {e}"}, status_code=500)
    finally:
        if db:
            db.close()


@app.put("/update_user/{user_id}", response_class=JSONResponse)
async def update_user(
    user_id: int,
    user_data: UserUpdate,
    db=Depends(get_db)
):

    try:
        with db.cursor() as cursor:
            # 1. Check for potential email/username conflicts (excluding the current user)
            cursor.execute(
                "SELECT idUser FROM User WHERE (Email = %s OR Username = %s) AND idUser != %s",
                (user_data.Email, user_data.Username, user_id) 
            )
            if cursor.fetchone():
                raise HTTPException(status_code=409, detail="Email or Username already in use by another user.")

            # 2. Update User table
            user_sql = """
                UPDATE User SET
                    Username = %s, Email = %s, NameSurname = %s,
                    CPF = %s, Number = %s, CEP = %s
                WHERE idUser = %s
            """
            cursor.execute(user_sql, (
                user_data.Username, user_data.Email, user_data.NameSurname,
                user_data.CPF, user_data.Number, user_data.CEP,
                user_id
            ))

            # 3. Update Address table
            # Check if address exists
            cursor.execute("SELECT idAddress FROM Address WHERE fk_User_idUser = %s", (user_id,))
            address_row = cursor.fetchone()
            if address_row:
                 # Update existing address
                 addr_sql = "UPDATE Address SET Address = %s WHERE fk_User_idUser = %s"
                 cursor.execute(addr_sql, (user_data.address, user_id))
            elif user_data.address:
                 # Insert new address
                 addr_sql = "INSERT INTO Address (Address, fk_User_idUser) VALUES (%s, %s)"
                 cursor.execute(addr_sql, (user_data.address, user_id))


            # 4. Update Complement table
            cursor.execute("SELECT idComplement FROM Complement WHERE fk_User_idUser = %s", (user_id,))
            complement_row = cursor.fetchone()

            if complement_row:
                if user_data.complement:
                    # Update existing complement
                    comp_sql = "UPDATE Complement SET Complement = %s WHERE fk_User_idUser = %s"
                    cursor.execute(comp_sql, (user_data.complement, user_id))
                else:
                    # Delete existing complement if new value is empty/null
                    comp_sql = "DELETE FROM Complement WHERE fk_User_idUser = %s"
                    cursor.execute(comp_sql, (user_id,))
            elif user_data.complement: # Only insert if complement is provided
                # Insert new complement
                comp_sql = "INSERT INTO Complement (Complement, fk_User_idUser) VALUES (%s, %s)"
                cursor.execute(comp_sql, (user_data.complement, user_id))

            db.commit() # Commits all changes together, also means this should be ACID compliant
            return {"message": "User updated successfully"}

    except HTTPException as http_exc:
         db.rollback() # Rollback on validation errors too
         raise http_exc
    except pymysql.err.IntegrityError as ie:
         db.rollback()
         print(f"Integrity error updating user {user_id}: {ie}")
         raise HTTPException(status_code=400, detail=f"Database integrity error: {ie}")
    except Exception as e:
        db.rollback()
        print(f"Error updating user {user_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to update user: {e}")
    finally:
        if db:
            db.close()


if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)