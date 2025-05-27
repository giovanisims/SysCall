import uvicorn
import os
import hashlib
from typing import Optional, Annotated
import re
import base64

from datetime import datetime, timedelta
import pymysql
from pymysql import cursors
from fastapi import (
    FastAPI,
    Request,
    Form,
    Depends,
    HTTPException,
    File,
    UploadFile
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
    'password': os.getenv('DB_PASSWORD', "admin123"),
    'db': 'SysCall',
    'charset': 'utf8mb4',
    'cursorclass': cursors.DictCursor,
}


def get_db():
    return pymysql.connect(**DB_CONFIG)


SESSION_TIMEOUT = 300  # seconds

app = FastAPI()


@app.middleware("http")
async def session_timeout_middleware(request: Request, call_next):
    # Rotas públicas que não precisam de autenticação
    public_routes = ["/login", "/sign_up", "/static", "/"]

    # Verifica se a rota atual é pública
    if any(request.url.path.startswith(route) for route in public_routes):
        return await call_next(request)

    # Verifica se o usuário está logado
    user_id = request.session.get("user_id")
    if not user_id:
        # Redireciona para a página de login se o usuário não estiver logado
        return RedirectResponse("/login", status_code=302)

    # Verifica o timeout da sessão
    last_activity = request.session.get("last_activity")
    now = datetime.now()

    if last_activity:
        # Corrige o formato para corresponder à data armazenada
        last_activity = datetime.strptime(last_activity, "%Y-%m-%d %H:%M:%S")
        if (now - last_activity) > timedelta(seconds=SESSION_TIMEOUT):
            request.session.clear()
            return RedirectResponse("/login", status_code=302)

    # Atualiza o timestamp da última atividade
    request.session["last_activity"] = now.strftime("%Y-%m-%d %H:%M:%S")

    # Continua para a próxima etapa da requisição
    response = await call_next(request)
    return response

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


@app.get("/users_crud", response_class=HTMLResponse)
async def users_crud(request: Request, db=Depends(get_db)):
    if request.session.get("user_role") != "System Administrator":
        return RedirectResponse("/", status_code=302)
    try:
        with db.cursor() as cursor:
            sql_query = """
                SELECT
                    u.idUser,
                    u.NameSurname,
                    u.Username,
                    u.Email,
                    u.CPF,
                    u.Number,
                    a.CEP,
                    a.Address,
                    r.Role,
                    c.Complement
                FROM User u
                LEFT JOIN Address a ON u.idUser = a.fk_User_idUser
                LEFT JOIN Role r ON u.fk_Role_idRole = r.idRole
                LEFT JOIN Complement c ON a.idAddress = c.fk_Address_idAddress
            """
            cursor.execute(sql_query)
            users = cursor.fetchall()
        return templates.TemplateResponse("users_crud.html", {
            "request": request,
            "users": users,
            "user_name": request.session.get("user_name"),
            "user_role": request.session.get("user_role"),
        })
    except Exception as e:
        print(f"Erro ao buscar usuários: {e}")
        return JSONResponse(content={"error": "Falha ao buscar usuários"}, status_code=500)
    finally:
        if db:
            db.close()

@app.post("/users/edit")
async def edit_user(
    request: Request,
    user_id: int = Form(...),
    name: str = Form(...),
    username: str = Form(...),
    email: str = Form(...),
    cpf: str = Form(...),
    cep: str = Form(...),
    phone: str = Form(...),
    address: str = Form(...),
    role: int = Form(...),
    observation: str = Form(None),  # Optional complement field
    password: str = Form(None),  # Optional password field
    db=Depends(get_db)
):
    try:
        with db.cursor() as cursor:
            # Clean up input data
            CPF = cpf.replace('.', '').replace('-', '')
            CEP = cep.replace('-', '').replace('.', '')
            Number = phone.replace('(', '').replace(')', '').replace('-', '').replace(' ', '')

            # Check for duplicate username/email/cpf (excluding current user)
            cursor.execute(
                """
                SELECT * FROM User WHERE (Username = %s OR Email = %s OR CPF = %s) AND idUser != %s
                """,
                (username, email, CPF, user_id)
            )
            existing_user = cursor.fetchone()
            if existing_user:
                if existing_user["Username"] == username:
                    error_message = "Username já existente."
                elif existing_user["Email"] == email:
                    error_message = "Email já existente."
                elif existing_user["CPF"] == CPF:
                    error_message = "CPF já existente."
                else:
                    error_message = "Dados já cadastrados."
                # Recarrega a lista de usuários
                cursor.execute("""
                    SELECT
                        u.idUser,
                        u.NameSurname,
                        u.Username,
                        u.Email,
                        u.CPF,
                        u.Number,
                        a.CEP,
                        a.Address,
                        r.Role,
                        c.Complement
                    FROM User u
                    LEFT JOIN Address a ON u.idUser = a.fk_User_idUser
                    LEFT JOIN Role r ON u.fk_Role_idRole = r.idRole
                    LEFT JOIN Complement c ON a.idAddress = c.fk_Address_idAddress
                """)
                users = cursor.fetchall()
                return templates.TemplateResponse(
                    "users_crud.html",
                    {
                        "request": request,
                        "users": users,
                        "user_name": request.session.get("user_name"),
                        "user_role": request.session.get("user_role"),
                        "edit_error": error_message,
                        "edit_user_id": user_id,
                        "edit_name": name,
                        "edit_username": username,
                        "edit_email": email,
                        "edit_cpf": cpf,
                        "edit_cep": cep,
                        "edit_phone": phone,
                        "edit_address": address,
                        "edit_role": role,
                        "edit_observation": observation,
                        "edit_password": password or "",
                    }
                )

            # Update User table
            if password and password.strip():
                Password_hash = hashlib.md5(password.encode()).hexdigest()
                cursor.execute(
                    """
                    UPDATE User
                    SET NameSurname = %s, Username = %s, Email = %s, CPF = %s, Number = %s, fk_Role_idRole = %s, Password = %s
                    WHERE idUser = %s
                    """,
                    (name, username, email, CPF, Number, role, Password_hash, user_id)
                )
            else:
                # If no password provided, update without changing password
                cursor.execute(
                    """
                    UPDATE User
                    SET NameSurname = %s, Username = %s, Email = %s, CPF = %s, Number = %s, fk_Role_idRole = %s
                    WHERE idUser = %s
                    """,
                    (name, username, email, CPF, Number, role, user_id)
                )
            
            # Update Address table
            cursor.execute(
                """
                UPDATE Address
                SET Address = %s, CEP = %s
                WHERE fk_User_idUser = %s
                """,
                (address, CEP, user_id)
            )
            
            # Handle complement/observation
            if observation:
                # Check if complement already exists
                cursor.execute(
                    """
                    SELECT c.idComplement, a.idAddress 
                    FROM Address a
                    LEFT JOIN Complement c ON a.idAddress = c.fk_Address_idAddress
                    WHERE a.fk_User_idUser = %s
                    """, 
                    (user_id,)
                )
                result = cursor.fetchone()
                
                if result and result.get('idComplement'):
                    # Update existing complement
                    cursor.execute(
                        """
                        UPDATE Complement
                        SET Complement = %s
                        WHERE idComplement = %s
                        """,
                        (observation, result['idComplement'])
                    )
                elif result:
                    # Insert new complement
                    cursor.execute(
                        """
                        INSERT INTO Complement (Complement, fk_Address_idAddress)
                        VALUES (%s, %s)
                        """,
                        (observation, result['idAddress'])
                    )
            
            db.commit()
        return RedirectResponse("/users_crud?edited=true", status_code=302)
    except Exception as e:
        db.rollback()
        print(f"Erro ao editar usuário: {e}")
        # Recarrega a lista de usuários e retorna erro genérico
        with db.cursor() as cursor:
            cursor.execute("""
                SELECT
                    u.idUser,
                    u.NameSurname,
                    u.Username,
                    u.Email,
                    u.CPF,
                    u.Number,
                    a.CEP,
                    a.Address,
                    r.Role,
                    c.Complement
                FROM User u
                LEFT JOIN Address a ON u.idUser = a.fk_User_idUser
                LEFT JOIN Role r ON u.fk_Role_idRole = r.idRole
                LEFT JOIN Complement c ON a.idAddress = c.fk_Address_idAddress
            """)
            users = cursor.fetchall()
        return templates.TemplateResponse(
            "users_crud.html",
            {
                "request": request,
                "users": users,
                "user_name": request.session.get("user_name"),
                "user_role": request.session.get("user_role"),
                "edit_error": "Erro ao editar usuário.",
                "edit_user_id": user_id,
                "edit_name": name,
                "edit_username": username,
                "edit_email": email,
                "edit_cpf": cpf,
                "edit_cep": cep,
                "edit_phone": phone,
                "edit_address": address,
                "edit_role": role,
                "edit_observation": observation,
                "edit_password": password or "",
            }
        )
    finally:
        if db:
            db.close()

@app.get("/users/delete/{user_id}", response_class=RedirectResponse)
async def delete_user(user_id: int, db=Depends(get_db)):
    try:
        with db.cursor() as cursor:
            cursor.execute("DELETE FROM Address WHERE fk_User_idUser = %s", (user_id,))
            cursor.execute("DELETE FROM User WHERE idUser = %s", (user_id,))
            db.commit()
        return RedirectResponse("/users_crud?deleted=true", status_code=302)
    except Exception as e:
        db.rollback()
        print(f"Erro ao deletar usuário: {e}")
        raise HTTPException(status_code=500, detail="Erro ao deletar usuário")
    finally:
        if db:
            db.close()

# Configuração de templates Jinja2
templates_dir = os.path.join(os.path.dirname(__file__), "pages", "html")
if not os.path.exists(templates_dir):
    print(f"Warning: Templates directory not found at {templates_dir}")
    # Handle appropriately
    pass
templates = Jinja2Templates(directory=templates_dir)


# Profile
@app.get("/profile", response_class=HTMLResponse)
async def read_profile(request: Request, db=Depends(get_db)):
    user_name = request.session.get("user_name", None)
    user_role = request.session.get("user_role", None)
    try:
        user_id = request.session.get("user_id", None)
        if not user_id:
            return RedirectResponse("/login", status_code=302)

        with db.cursor() as cursor:
            # Query para buscar os dados do usuário
            sql_query = """
                SELECT
                    u.Username,
                    u.NameSurname,
                    u.Email,
                    u.CPF,
                    u.Number,
                    a.Address,
                    a.CEP,
                    c.Complement,
                    u.ProfilePicture
                FROM User u
                LEFT JOIN Address a ON u.idUser = a.fk_User_idUser
                LEFT JOIN Complement c ON a.idAddress = c.fk_Address_idAddress
                WHERE u.idUser = %s
            """
            cursor.execute(sql_query, (user_id,))
            user_data = cursor.fetchone()

        if not user_data:
            return RedirectResponse("/login", status_code=302)
        
        if not user_data.get("Complement"):
            #I know that`s not the best way of doin this, but idc
            user_data["Complement"] = " "
        
        profile_picture = None
        if user_data.get("ProfilePicture"):
            profile_picture = base64.b64encode(user_data["ProfilePicture"]).decode("utf-8")

        # Renderiza o template com os dados do usuário
        return templates.TemplateResponse(
            "profile.html",
            {
                "request": request,
                "user_name": user_name,
                "user_role": user_role,
                "user": user_data,
                "profile_picture": profile_picture,
            },
        )
    except Exception as e:
        print(f"Erro ao carregar o perfil: {e}")
        return JSONResponse(content={"error": "Erro ao carregar o perfil"}, status_code=500)
    finally:
        if db:
            db.close()
            

@app.get("/profile/data", response_class=JSONResponse)
async def get_profile_data(request: Request, db=Depends(get_db)):
    try:
        user_id = request.session.get("user_id", None)
        if not user_id:
            return JSONResponse(content={"error": "Usuário não autenticado"}, status_code=401)

        with db.cursor() as cursor:
            sql_query = """
                SELECT
                    u.Username,
                    u.NameSurname,
                    u.Email,
                    u.CPF,
                    u.Number,
                    a.Address,
                    a.CEP,
                    c.Complement
                FROM User u
                LEFT JOIN Address a ON u.idUser = a.fk_User_idUser
                LEFT JOIN Complement c ON a.idAddress = c.fk_Address_idAddress
                WHERE u.idUser = %s
            """
            cursor.execute(sql_query, (user_id,))
            user_data = cursor.fetchone()

        return user_data if user_data else JSONResponse(content={"error": "Usuário não encontrado"}, status_code=404)
    except Exception as e:
        print(f"Erro ao carregar os dados do perfil: {e}")
        return JSONResponse(content={"error": "Erro ao carregar os dados do perfil"}, status_code=500)
    finally:
        if db:
            db.close()
            
            
@app.post("/profile/edit")
async def edit_profile(
    request: Request,
    file: Optional[UploadFile] = File(None),
    username: str = Form(...),
    namesurname: str = Form(...),
    email: str = Form(...),
    cpf: str = Form(...),
    phone: str = Form(...),
    cep: str = Form(...),
    address: str = Form(...),
    observation: str = Form(None),  # Campo opcional
    db=Depends(get_db)
):
    try:
        user_id = request.session.get("user_id", None)
        if not user_id:
            return RedirectResponse("/login", status_code=302)

        # Limpeza dos dados (remover caracteres indesejados)
        clean_phone = phone.replace("(", "").replace(")", "").replace("-", "").replace(" ", "")
        clean_cep = cep.replace("-", "")

        with db.cursor() as cursor:
            # Atualiza os dados do usuário na tabela `User`
            cursor.execute(
                """
                UPDATE User
                SET Username =%s, NameSurname =%s, Email =%s, CPF =%s, Number =%s
                WHERE idUser =%s
                """,
                (username, namesurname, email, cpf, clean_phone, user_id)
            )

            # Atualiza os dados do endereço na tabela `Address`
            cursor.execute(
                """
                UPDATE Address
                SET Address =%s, CEP =%s
                WHERE fk_User_idUser =%s
                """,
                (address, clean_cep, user_id)
            )

            # Se o complemento for vazio, remova-o
            
            if file:
                image_data = await file.read()  # Lê o conteúdo do arquivo
                cursor.execute(
                    """
                    UPDATE User
                    SET ProfilePicture = %s
                    WHERE idUser = %s
                    """,
                    (image_data, user_id)
                )
            
            if observation:
                cursor.execute(
                    """
                    INSERT INTO Complement (Complement, fk_Address_idAddress)
                    VALUES (%s, (SELECT idAddress FROM Address WHERE fk_User_idUser = %s))
                    ON DUPLICATE KEY UPDATE Complement = %s
                    """,
                    (observation, user_id, observation)
                )
            else:
                cursor.execute(
                    """
                    DELETE FROM Complement
                    WHERE fk_Address_idAddress = (SELECT idAddress FROM Address WHERE fk_User_idUser = %s)
                    """,
                    (user_id,)
                )

            db.commit()  

        return RedirectResponse("/profile", status_code=302)
    except Exception as e:
        db.rollback()  
        print(f"Erro ao atualizar o perfil: {e}")
        raise HTTPException(status_code=500, detail="Erro ao atualizar o perfil")
    finally:
        if db:
            db.close()

# Endpoints das páginas estáticas


@app.get("/tickets_crud", response_class=HTMLResponse)
async def tickets_crud(request: Request, db=Depends(get_db)):
    if request.session.get("user_role") != "System Administrator":
        return RedirectResponse("/", status_code=302)
    try:
        with db.cursor() as cursor:
            # Consulta SQL para buscar os tickets
            sql_query = """
                SELECT
                    i.idIssue AS id,
                    i.Title AS title,
                    i.Description AS description,
                    DATE_FORMAT(i.CreatedDate, '%d/%m/%Y') AS creation_date,
                    ip.StateName AS progress,
                    it.StateName AS type,
                    p.Priority AS priority,
                    u.NameSurname AS creator
                FROM
                    Issue i
                LEFT JOIN User u ON i.fk_User_idUser = u.idUser
                LEFT JOIN IssueProgress ip ON i.fk_IssueProgress_idIssueProgress = ip.idIssueProgress
                LEFT JOIN IssueType it ON i.fk_IssueType_idIssueType = it.idIssueType
                LEFT JOIN Priority p ON i.fk_Priority_idPriority = p.idPriority
            """
            cursor.execute(sql_query)
            tickets = cursor.fetchall()  # Busca todos os resultados

        # Passa os tickets para o template
        return templates.TemplateResponse("tickets_crud.html", {"request": request, "tickets": tickets, "user_name": request.session.get("user_name"), "user_role": request.session.get("user_role")})
    except Exception as e:
        print(f"Erro ao buscar tickets: {e}")
        return JSONResponse(content={"error": "Falha ao buscar tickets"}, status_code=500)
    finally:
        if db:
            db.close()
            
@app.get("/tickets/delete/{ticket_id}", response_class=RedirectResponse)
async def delete_ticket(ticket_id: int, db=Depends(get_db)):
    try:
        with db.cursor() as cursor:
            cursor.execute(
                "DELETE FROM Issue WHERE idIssue = %s", (ticket_id,)
            )
            db.commit()
            return RedirectResponse("/tickets_crud?deleted=true", status_code=302)
    except Exception as e:
        db.rollback()
        print(f"Erro: {e}")
        raise HTTPException(
            status_code=500, detail="Erro ao deletar o ticket"
        )
    finally:
        if db:
            db.close()
            
@app.post("/tickets/edit")
async def edit_ticket(
    ticket_id: int = Form(...),
    title: str = Form(...),
    description: str = Form(...),
    priority: str = Form(...),
    type: str = Form(...),
    db=Depends(get_db)
):
    try:
        with db.cursor() as cursor:
            cursor.execute(
                """
                UPDATE Issue
                SET Title = %s, Description = %s, 
                fk_Priority_idPriority = (
                    SELECT idPriority FROM Priority WHERE Priority = %s
                ),
                fk_IssueType_idIssueType = (
                    SELECT idIssueType FROM IssueType WHERE StateName = %s
                )
                WHERE idIssue = %s
                """,
                (title, description, priority, type, ticket_id)
            )
            db.commit()
        return RedirectResponse("/tickets_crud?edited=true", status_code=302)
    except Exception as e:
        db.rollback()
        print(f"Erro ao editar o ticket: {e}")
        raise HTTPException(status_code=500, detail="Erro ao editar o ticket")
            
@app.get("/", response_class=HTMLResponse)
async def read_main(request: Request):
    user_name = request.session.get("user_name", None)
    user_role = request.session.get("user_role", None)
    return templates.TemplateResponse("main.html", {"request": request, "user_name": user_name, "user_role": user_role})


@app.get("/contact", response_class=HTMLResponse)
async def read_main(request: Request):
    user_name = request.session.get("user_name", None)
    user_role = request.session.get("user_role", None)
    return templates.TemplateResponse("contact.html", {"request": request, "user_name": user_name, "user_role": user_role})

@app.get("/login", response_class=HTMLResponse)
async def read_login(request: Request):
    error = request.query_params.get("error")
    return templates.TemplateResponse("login.html", {"request": request, "error": error})


@app.get("/sign_up", response_class=HTMLResponse)
async def read_register(request: Request):
    return templates.TemplateResponse("sign_up.html", {"request": request})


@app.get("/tickets", response_class=HTMLResponse)
async def read_register(request: Request):
    user_name = request.session.get("user_name", None)
    user_role = request.session.get("user_role", None)
    return templates.TemplateResponse("tickets.html", {"request": request, "user_name": user_name, "user_role": user_role})


@app.get("/ticket_detail", response_class=HTMLResponse)
async def getTicketDetail(
    request: Request,
    ticketId: int,
    db=Depends(get_db)
):
    try:
        with db.cursor() as cursor:
            sql_query = """
                SELECT
                    i.idIssue,
                    i.Title,
                    i.Description,
                    i.CreatedDate,
                    u.Username AS ClientUsername,
                    t.Username AS TechnicianUsername, -- aqui está o nome do técnico
                    ip.StateName AS ProgressName,
                    it.StateName AS TypeName,
                    p.Priority AS PriorityName
                FROM
                    Issue i
                LEFT JOIN User u ON i.fk_User_idUser = u.idUser
                LEFT JOIN User t ON i.fk_Technician_idUser = t.idUser
                LEFT JOIN IssueProgress ip ON i.fk_IssueProgress_idIssueProgress = ip.idIssueProgress
                LEFT JOIN IssueType it ON i.fk_IssueType_idIssueType = it.idIssueType
                LEFT JOIN Priority p ON i.fk_Priority_idPriority = p.idPriority
                WHERE
                    i.idIssue = %s;
            """

            cursor.execute(sql_query, (ticketId,))
            TicketDetail = cursor.fetchone()

            if TicketDetail and "CreatedDate" in TicketDetail:
                TicketDetail["CreatedDate"] = TicketDetail["CreatedDate"].strftime(
                    "%d/%m/%Y")

            if TicketDetail and TicketDetail.get("TechnicianUsername") is None:
                TicketDetail["TechnicianUsername"] = "-"

            user_name = request.session.get("user_name", None)
            user_role = request.session.get("user_role", None)

        if TicketDetail:
            return templates.TemplateResponse("ticket_detail.html", {"request": request, "user_name": user_name, "user_role": user_role, "ticket": TicketDetail})
        else:
            error_message = "Ticket não encontrado"
            return templates.TemplateResponse("ticket_detail.html", {"request": request, "user_name": user_name, "user_role": user_role, "error": error_message})

    finally:
        db.close()


@app.get("/ticket_detail_form", response_class=HTMLResponse)
async def getTicketDetail(
    request: Request,
    ticketId: int,
    db=Depends(get_db)
):
    try:
        with db.cursor() as cursor:
            sql_query = """
                SELECT
                    i.idIssue,
                    i.Title,
                    i.Description
                FROM
                    Issue i
                WHERE idIssue = %s
            """

            cursor.execute(sql_query, (ticketId,))
            TicketEdit = cursor.fetchone()

            user_name = request.session.get("user_name", None)
            user_role = request.session.get("user_role", None)

        if TicketEdit:
            return templates.TemplateResponse("ticket_detail_form.html", {"request": request, "user_name": user_name, "user_role": user_role, "ticket": TicketEdit})
        else:
            error_message = "Ticket não encontrado"
            return templates.TemplateResponse("ticket_detail_form.html", {"request": request, "user_name": user_name, "user_role": user_role, "error": error_message})

    finally:
        db.close()


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
                    r.role AS UserRole,
                    u.idUser
                FROM User u
                JOIN Role r ON u.fk_Role_idRole = r.idRole 
                WHERE u.Email = %s AND u.Password = %s
            """
            cursor.execute(sql_query, (email, hashed_password))
            user = cursor.fetchone()

            if user:
                # Armazena o nome do usuário na sessão
                request.session["user_name"] = user["NameSurname"]

                # armazena o ID do usuario
                request.session["user_id"] = user["idUser"]

                # Agora user["UserRole"] conterá a string do nome da role
                request.session["user_role"] = user["UserRole"]

                request.session["last_activity"] = datetime.utcnow().strftime(
                    "%Y-%m-%d %H:%M:%S")
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


@app.post("/users/submit")
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
    observation: str = Form(None),  # None lets the field be null
    password: str = Form(...),
    where: int = Form(1),  # Default to 1 (sign_up page)
    db=Depends(get_db)
):
    def get_roles(db):
        with db.cursor() as cursor:
            cursor.execute("SELECT idRole, Role FROM Role")
            return cursor.fetchall()

    def render_sign_up_with_error(error_message):
        roles = get_roles(db)
        # Repassa todos os campos preenchidos para o template
        return templates.TemplateResponse(
            "sign_up.html",
            {
                "request": request,
                "error": error_message,
                "roles": roles,
                "namesurname": namesurname,
                "username": username,
                "email": email,
                "cpf": cpf,
                "phone": phone,
                "cep": cep,
                "address": address,
                "role": role,
                "observation": observation,
            },
            status_code=200
        )

    def render_users_crud_with_error(error_message):
        with db.cursor() as user_cursor:
            user_cursor.execute("""
                SELECT
                    u.idUser,
                    u.NameSurname,
                    u.Username,
                    u.Email,
                    u.CPF,
                    u.Number,
                    a.CEP,
                    a.Address,
                    r.Role,
                    c.Complement
                FROM User u
                LEFT JOIN Address a ON u.idUser = a.fk_User_idUser
                LEFT JOIN Role r ON u.fk_Role_idRole = r.idRole
                LEFT JOIN Complement c ON a.idAddress = c.fk_Address_idAddress
            """)
            users = user_cursor.fetchall()
        return templates.TemplateResponse(
            "users_crud.html",
            {
                "request": request,
                "error": error_message,
                "users": users,
                "user_name": request.session.get("user_name"),
                "user_role": request.session.get("user_role"),
                "namesurname": namesurname,
                "username": username,
                "email": email,
                "cpf": cpf,
                "phone": phone,
                "cep": cep,
                "address": address,
                "role": role,
                "observation": observation,
                "password": password,
            },
            status_code=200
        )

    if not re.match(r"^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*\W).{8,}", password):
        error_message = "Password doesn't match the requirements"
        if where == 1:
            return render_sign_up_with_error(error_message)
        else:
            return render_users_crud_with_error(error_message)

    NameSurname = namesurname
    Username = username
    Email = email
    CPF = cpf.replace('.', '').replace('-', '')
    CEP = cep.replace('-', '').replace('.', '')
    Number = phone.replace('(', '').replace(')', '').replace('-', '').replace(' ', '')
    Address_text = address
    Complement_text = observation
    fk_Role_idRole = role

    Password = hashlib.md5(password.encode()).hexdigest()


    try:
        with db.cursor() as cursor:
            cursor.execute(
                "SELECT * FROM User WHERE Username = %s OR Email = %s OR CPF = %s", (Username, Email, CPF))
            existing_user = cursor.fetchone()

            if existing_user:
                if existing_user["Username"] == Username:
                    error_message = "Username já existente."
                elif existing_user["Email"] == Email:
                    error_message = "Email já existente."
                elif existing_user["CPF"] == CPF:
                    error_message = "CPF já existente."
                else:
                    error_message = "Dados já cadastrados."
                if where == 1:
                    return render_sign_up_with_error(error_message)
                else:
                    return render_users_crud_with_error(error_message)

            cursor.execute(
                "SELECT idRole FROM Role WHERE idRole = %s", (fk_Role_idRole,))
            role_exists = cursor.fetchone()

            if not role_exists:
                error_message = "Invalid role ID provided."
                if where == 1:
                    return render_sign_up_with_error(error_message)
                else:
                    return render_users_crud_with_error(error_message)

            cursor.execute(
                "INSERT INTO User (Username, Email, NameSurname, CPF, Number, Password, fk_Role_idRole) VALUES (%s, %s, %s, %s, %s, %s, %s)",
                (Username, Email, NameSurname, CPF, Number, Password, fk_Role_idRole)
            )
            user_id = cursor.lastrowid

            cursor.execute(
                "INSERT INTO Address (Address, fk_User_idUser, CEP) VALUES (%s, %s, %s)", (Address_text, user_id, CEP))
            address_id = cursor.lastrowid

            if Complement_text:
                cursor.execute("INSERT INTO Complement (Complement, fk_Address_idAddress) VALUES (%s, %s)", (
                    Complement_text, address_id))

            db.commit()

            if where == 1:
                return RedirectResponse("/login", status_code=302)
            elif where == 2:
                return RedirectResponse("/users_crud?added=true", status_code=302)
            else:
                return RedirectResponse("/login", status_code=302)

    except pymysql.err.IntegrityError as ie:
        db.rollback()
        print(f"Integrity error during sign up: {ie}")
        error_message = "Registration failed due to data conflict (e.g., duplicate entry or invalid foreign key)."
        if where == 1:
            return render_sign_up_with_error(error_message)
        else:
            return render_users_crud_with_error(error_message)
    except Exception as e:
        db.rollback()
        print(f"Error during sign up: {e}")
        error_message = "An error occurred during registration."
        if where == 1:
            return render_sign_up_with_error(error_message)
        else:
            return render_users_crud_with_error(error_message)
    finally:
        if db:
            db.close()



@app.get("/tickets/data")
async def ticket(
    request: Request,
    db=Depends(get_db)
):
    user_role = request.session.get("user_role", None)
    if user_role == "User" or user_role == "System Administrator":
        try:
            with db.cursor() as cursor:
                sql_query = """
                    SELECT
                        i.idIssue AS id,
                        i.Title AS title,
                        i.Description AS description,
                        p.Priority AS priority,
                        ip.StateName AS progress
                    FROM
                        Issue i
                    LEFT JOIN Priority p ON i.fk_Priority_idPriority = p.idPriority
                    LEFT JOIN IssueProgress ip ON i.fk_IssueProgress_idIssueProgress = ip.idIssueProgress
                    WHERE fk_User_idUser = %s
                """
                user_id = request.session.get("user_id")
                if not user_id:
                    raise HTTPException(
                        status_code=401, detail="User not authenticated")

                cursor.execute(sql_query, (user_id,))
                ticket = cursor.fetchall()

                if ticket:
                    return ticket
                else:
                    error_message = "Ticket não encontrado"
                    return templates.TemplateResponse("tickets.html", {"request": request, "error": error_message})
        finally:
            db.close()
    else:
        if user_role == "Technician":
            try:
                with db.cursor() as cursor:
                    sql_query = """
                        SELECT
                        i.idIssue AS id,
                        i.Title AS title,
                        i.Description AS description,
                        p.Priority AS priority,
                        ip.StateName AS progress
                        FROM
                            Issue i
                        LEFT JOIN Priority p ON i.fk_Priority_idPriority = p.idPriority
                        LEFT JOIN IssueProgress ip ON i.fk_IssueProgress_idIssueProgress = ip.idIssueProgress
                        WHERE fk_User_idUser != %s
                    """
                    user_id = request.session.get("user_id")
                    if not user_id:
                        raise HTTPException(
                            status_code=401, detail="User not authenticated")

                    cursor.execute(sql_query, (user_id,))
                    ticket = cursor.fetchall()

                    if ticket:
                        return ticket
                    else:
                        error_message = "Ticket não encontrado"
                        return templates.TemplateResponse("tickets.html", {"request": request, "error": error_message})
            finally:
                db.close()


@app.post("/tickets/submit")
async def ticketsSubmit(
    request: Request,
    where: int,
    title: str = Form(...),
    description: str = Form(...),
    priority: int = Form(...),
    type: int = Form(...),
    db=Depends(get_db)
):

    Title = title
    Description = description
    Priority = priority
    Type = type

    try:
        with db.cursor() as cursor:
            user_id = request.session.get("user_id")
            cursor.execute(
                "INSERT INTO Issue (Title, Description, fk_User_idUser, fk_Priority_idPriority, fk_IssueType_idIssueType) VALUES (%s, %s, %s, %s, %s)",
                (Title, Description, user_id, Priority, Type)
            )
            db.commit()

            if where == 1:
                return RedirectResponse("/tickets?added=true", status_code=302)
            elif where == 2:
                return RedirectResponse("/tickets_crud?added=true", status_code=302)

    finally:
        if db:
            db.close()


@app.post("/tickets/history/submit")
async def ticketsAnswer(
    request: Request,
    ticketId: int = Form(...),
    answer_title: str = Form(...),
    answer_description: str = Form(...),

    db=Depends(get_db)
):
    Title = answer_title
    Description = answer_description
    TicketId = ticketId
    TechnicianId = request.session.get("user_id")
    try:
        with db.cursor() as cursor:
            cursor.execute(
                "INSERT INTO IssueHistory (fk_Issue_idIssue, Title, Description) VALUES (%s, %s, %s)",
                (TicketId, Title, Description)
            )
            cursor.execute(
                "UPDATE Issue SET fk_IssueProgress_idIssueProgress = %s WHERE idIssue = %s",
                (2, TicketId)
            )
            cursor.execute(
                "UPDATE Issue SET fk_Technician_idUser = %s WHERE idIssue = %s",
                (TechnicianId, TicketId)
            )
            db.commit()
            return RedirectResponse(f"/ticket_detail?ticketId={TicketId}", status_code=302)
    finally:
        if db:
            db.close()


@app.get("/tickets/history")
async def ticketHistory(
    request: Request,
    ticketId: int,
    db=Depends(get_db)
):
    try:
        with db.cursor() as cursor:
            sql_query = """
                    SELECT
                        Title,
                        Description
                    FROM
                        issueHistory
                    WHERE fk_Issue_idIssue = %s
                    ORDER BY 1 DESC;
                """
            cursor.execute(sql_query, (ticketId,))
            ticket = cursor.fetchall()

            if ticket:
                return ticket
            else:
                return []
    finally:
        db.close()


@app.get("/tickets/finish")
async def finish_ticket(
request: Request,
    ticketId: int,
    db=Depends(get_db)
):
    
    try:
        with db.cursor() as cursor:
            cursor.execute(
                "UPDATE Issue SET fk_IssueProgress_idIssueProgress = %s WHERE idIssue = %s",
                (3, ticketId)
            )
            db.commit()
        return RedirectResponse(f"/ticket_detail?ticketId={ticketId}", status_code=302)
    finally:
        db.close()


@app.get("/tickets/search", response_class=JSONResponse)
async def search_tickets(q: str, request: Request, db=Depends(get_db)):
    """
    Search tickets by title or description containing the query string (case-insensitive),
    filtered by user role (same logic as /tickets/data).
    """
    user_role = request.session.get("user_role", None)
    user_id = request.session.get("user_id", None)
    search_value = f"%{q}%"
    try:
        with db.cursor() as cursor:
            if user_role in ("User", "System Administrator"):
                sql_query = """
                    SELECT
                        i.idIssue AS id,
                        i.Title AS title,
                        i.Description AS description,
                        p.Priority AS priority
                    FROM
                        Issue i
                    LEFT JOIN Priority p ON i.fk_Priority_idPriority = p.idPriority
                    WHERE fk_User_idUser = %s AND (i.Title LIKE %s OR i.Description LIKE %s)
                """
                cursor.execute(sql_query, (user_id, search_value, search_value))
            elif user_role == "Technician":
                sql_query = """
                    SELECT
                        i.idIssue AS id,
                        i.Title AS title,
                        i.Description AS description,
                        p.Priority AS priority
                    FROM
                        Issue i
                    LEFT JOIN Priority p ON i.fk_Priority_idPriority = p.idPriority
                    WHERE fk_User_idUser != %s AND (i.Title LIKE %s OR i.Description LIKE %s)
                """
                cursor.execute(sql_query, (user_id, search_value, search_value))
            else:
                # Não autenticado ou sem role válida
                return []
            tickets = cursor.fetchall()
            return tickets
    except Exception as e:
        print(f"Erro ao buscar tickets: {e}")
        return JSONResponse(content={"error": "Falha ao buscar tickets"}, status_code=500)
    finally:
        if db:
            db.close()


if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
