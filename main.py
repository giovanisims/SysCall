import pymysql
import base64
import os
import sys

from mangum import Mangum
from fastapi import FastAPI, Request, Form, Depends, UploadFile, File
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from starlette.middleware.sessions import SessionMiddleware
from datetime import date, datetime

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
    "user": "Lucas",
    "password": "2525",
    "database": "syscall"
}


@app.get("/", response_class=HTMLResponse)
async def read_main(request: Request):
    return templates.TemplateResponse("main.html", {"request": request})

# This code only runs if the script is executed directly, not if it is imported as a module.
if __name__ == "__main__":
    import uvicorn  
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)