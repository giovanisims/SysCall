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
    'password': os.getenv('DB_PASSWORD', 'Lili2209*'),
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
    user_role = request.session.get("user_role", None)
    return templates.TemplateResponse("users_crud.html", {"request": request, "user_name": user_name, "user_role": user_role})

@app.get("/", response_class=HTMLResponse)
async def read_main(request: Request):
    user_name = request.session.get("user_name", None)
    user_role = request.session.get("user_role", None)
    return templates.TemplateResponse("main.html", {"request": request, "user_name": user_name, "user_role": user_role})

@app.get("/login", response_class=HTMLResponse)
async def read_login(request: Request):
    return templates.TemplateResponse("login.html", {"request": request})

@app.get("/sign_up", response_class=HTMLResponse)
async def read_register(request: Request):
    return templates.TemplateResponse("sign_up.html", {"request": request})

@app.get("/tickets", response_class=HTMLResponse)
async def read_register(request: Request):
    user_name = request.session.get("user_name", None)
    user_role = request.session.get("user_role", None)
    return templates.TemplateResponse("tickets.html", {"request": request, "user_name": user_name, "user_role": user_role})

@app.post("/login")
async def login(
    request: Request,
    email: str = Form(...),
    password: str = Form(...),
    db=Depends(get_db)
):
    try:
        hashed_password = hashlib.md5(password.encode()).hexdigest()
        with db.cursor() as cursor:
            sql_query = """
                SELECT 
                    u.NameSurname, 
                    r.role AS UserRole 
                FROM User u
                JOIN role r ON u.fk_Role_idRole = r.idRole 
                WHERE u.Email = %s AND u.Password = %s
            """
            cursor.execute(sql_query, (email, hashed_password))
            user = cursor.fetchone()

            if user:
                # Armazena o nome do usuário na sessão
                request.session["user_name"] = user["NameSurname"]
                # Agora user["UserRole"] conterá a string do nome da role
                request.session["user_role"] = user["UserRole"] 
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
    namesurname: str = Form(...),
    username: str = Form(...),
    email: str = Form(...),
    cpf: str = Form(...),
    phone: str = Form(...),
    cep: str = Form(...),
    address: str = Form(...),
    role: int = Form(...),
    observation: str = Form(None), # None lets the field be null
    password: str = Form(...),
    db=Depends(get_db)
):
    if not re.match(r"^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*\W).{8,}", password):
        return templates.TemplateResponse("signup.html", {"request": request, "error": "Password doesn't match the requirements"})

    NameSurname = namesurname
    Username = username
    Email = email
    CPF = cpf.replace('.', '').replace('-', '')
    CEP = cep.replace('-', '').replace('.', '')
    Number = phone.replace('(', '').replace(')', '').replace('-', '').replace(' ', '')
    Address_text = address # Renamed to avoid conflict with Address table name
    Complement_text = observation # Renamed for clarity
    fk_Role_idRole = role

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

            # Validate the role ID against the Role table
            cursor.execute("SELECT idRole FROM Role WHERE idRole = %s", (fk_Role_idRole,))
            role_exists = cursor.fetchone()

            if not role_exists:
                error_message = "Invalid role ID provided."
                return templates.TemplateResponse("sign_up.html", {"request": request, "error": error_message})

            # Inserts into each table according to independence

            # First, insert the user into the User table
            cursor.execute(
                "INSERT INTO User (Username, Email, NameSurname, CPF, Number, Password, fk_Role_idRole) VALUES (%s, %s, %s, %s, %s, %s, %s)",
                (Username, Email, NameSurname, CPF, Number, Password, fk_Role_idRole)
            )
            user_id = cursor.lastrowid
            # No commit here yet, do it after all related inserts

            # Now, insert the address into the Address table, referencing the User
            cursor.execute("INSERT INTO Address (Address, fk_User_idUser, CEP) VALUES (%s, %s, %s)", (Address_text, user_id, CEP))
            address_id = cursor.lastrowid # Get the ID of the inserted address
            # No commit here yet

            # Insert the complement into the DB if it exists, referencing the Address
            if Complement_text:
                 cursor.execute("INSERT INTO Complement (Complement, fk_Address_idAddress) VALUES (%s, %s)", (Complement_text, address_id)) # Use address_id
                 # No commit here yet

            db.commit() # Commit all changes together

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
        if db:
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
    Password: Optional[str] = None # Add optional password field
    fk_Role_idRole: int

@app.get("/delete_user")
async def delete_user(
    user_id: int,
    db=Depends(get_db)
):
    try:
        with db.cursor() as cursor:
            # 1. Find the address ID associated with the user
            cursor.execute("SELECT idAddress FROM Address WHERE fk_User_idUser = %s", (user_id,))
            address_result = cursor.fetchone()

            if address_result:
                address_id = address_result['idAddress']
                # 2. Delete related records from Complement using the address ID
                cursor.execute("DELETE FROM Complement WHERE fk_Address_idAddress = %s", (address_id,))
                # No commit yet

            # 3. Delete related records from Address
            cursor.execute("DELETE FROM Address WHERE fk_User_idUser = %s", (user_id,))
            # No commit yet

            # 4. Finally, delete the user
            cursor.execute("DELETE FROM User WHERE idUser = %s", (user_id,))

            db.commit() # Commit all deletions together

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
            # Join User -> Address -> Complement
            sql = """
                SELECT
                    u.idUser, u.Username, u.NameSurname, u.Email, u.CPF, u.Number,
                    a.Address,
                    c.Complement
                FROM User u
                LEFT JOIN Address a ON u.idUser = a.fk_User_idUser
                LEFT JOIN Complement c ON a.idAddress = c.fk_Address_idAddress -- Join Complement via Address
            """
            cursor.execute(sql)
            users = cursor.fetchall()
            print(users)
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
            # Fetch user data along with address and complement via address
            sql = """
                SELECT
                    u.idUser, u.Username, u.Email, u.NameSurname, u.CPF, u.Number,
                    a.idAddress, a.Address, -- Select address ID as well
                    c.idComplement, c.Complement -- Select complement ID as well
                FROM User u
                LEFT JOIN Address a ON u.idUser = a.fk_User_idUser
                LEFT JOIN Complement c ON a.idAddress = c.fk_Address_idAddress -- Join Complement via Address
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
    user_data: UserUpdate,  # Assuming UserUpdate has fields like 'address' and 'complement'
    db=Depends(get_db)
):
    # Cleanse input data
    clean_cpf = re.sub(r'\D', '', user_data.CPF)
    clean_number = re.sub(r'\D', '', user_data.Number)
    clean_cep = re.sub(r'\D', '', user_data.CEP)

    if len(clean_cpf) != 11:
        raise HTTPException(status_code=400, detail="Invalid CPF format.")
    if not (10 <= len(clean_number) <= 11):
        raise HTTPException(status_code=400, detail="Invalid phone number format.")
    if len(clean_cep) != 8:
        raise HTTPException(status_code=400, detail="Invalid CEP format.")

    # Validate new password if provided
    hashed_password = None
    if user_data.Password and user_data.Password.strip():  # Check if password is provided and not just whitespace
        if not re.match(r"^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*\W).{8,}", user_data.Password):
            raise HTTPException(
                status_code=400,
                detail="Password doesn't match the requirements (min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special character)."
            )
        hashed_password = hashlib.md5(user_data.Password.encode()).hexdigest()

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
            user_sql_base = """
                UPDATE User SET
                    Username = %s, Email = %s, NameSurname = %s,
                    CPF = %s, Number = %s
            """
            params = [
                user_data.Username, user_data.Email, user_data.NameSurname,
                clean_cpf, clean_number
            ]

            # Conditionally add password update
            if hashed_password:
                user_sql_base += ", Password = %s"
                params.append(hashed_password)

            user_sql = user_sql_base + " WHERE idUser = %s"
            params.append(user_id)

            cursor.execute(user_sql, tuple(params))  # Execute with all parameters

            # 3. Find or Create Address and get its ID
            cursor.execute("SELECT idAddress FROM Address WHERE fk_User_idUser = %s", (user_id,))
            address_row = cursor.fetchone()
            address_id = None

            if address_row:
                address_id = address_row['idAddress']
                # Update existing address if provided
                if user_data.Address is not None or user_data.CEP is not None:  # Check if address or CEP data is provided
                    addr_sql = "UPDATE Address SET Address = %s, CEP = %s WHERE idAddress = %s"
                    cursor.execute(addr_sql, (user_data.Address, clean_cep, address_id))
            elif user_data.Address is not None or user_data.CEP is not None:  # Only insert if address or CEP data is provided
                # Insert new address
                addr_sql = "INSERT INTO Address (Address, fk_User_idUser, CEP) VALUES (%s, %s, %s)"
                cursor.execute(addr_sql, (user_data.Address, user_id, clean_cep))
                address_id = cursor.lastrowid  # Get the new address ID

            # 4. Update Complement table using the address_id (if address exists)
            if address_id:  # Only manage complement if an address exists/was created
                cursor.execute("SELECT idComplement FROM Complement WHERE fk_Address_idAddress = %s", (address_id,))
                complement_row = cursor.fetchone()

                if complement_row:
                    complement_id = complement_row['idComplement']
                    if user_data.Complement:
                        # Update existing complement
                        comp_sql = "UPDATE Complement SET Complement = %s WHERE idComplement = %s"
                        cursor.execute(comp_sql, (user_data.Complement, complement_id))
                    else:
                        # Delete existing complement if new value is empty/null
                        comp_sql = "DELETE FROM Complement WHERE idComplement = %s"
                        cursor.execute(comp_sql, (complement_id,))
                elif user_data.Complement:  # Only insert if complement is provided
                    # Insert new complement
                    comp_sql = "INSERT INTO Complement (Complement, fk_Address_idAddress) VALUES (%s, %s)"
                    cursor.execute(comp_sql, (user_data.Complement, address_id))

            db.commit()  # Commit all changes together
            return {"message": "User updated successfully"}

    except HTTPException as http_exc:
        db.rollback()  # Rollback on validation errors too
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