from fastapi import FastAPI, Form
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from jinja2 import Template

app = FastAPI()

# o codigo n funciona sem isso, coisa do chat, n sei o pq tb
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Precisa disso pra rodar o Css (n sei o pq pra falar a vdd)
app.mount("/css", StaticFiles(directory="pages/css"), name="css")

@app.get("/", response_class=HTMLResponse)
async def formulario():
    with open("pages/html/sign_up.html", "r", encoding="utf-8") as file:
        template = Template(file.read())
        rendered_html = template.render(error_message="")  # aqui ele faz a mensagem de erro ficar invisivel, ela só aparece se errarem a senha
        return HTMLResponse(content=rendered_html)


#API q pega as info do formulario e verifica as senhas
#as variaveis das senhas tem os mesmos nomes dos ID do form, ai o Form(...) pega o valor deles
#ai tem esse with open q abre o arquivo html e o template renderiza ele
@app.post("/verify")
async def verificar(password: str = Form(...), password_confirm: str = Form(...)):
    with open("pages/html/sign_up.html", "r", encoding="utf-8") as file:
        template = Template(file.read())
    
    if password == password_confirm:
        return {"message": "Passwords Match!"} #tem q fazer a parte q leva pra pagina inicial quando da certo, mas é problema pra depois
    else:
        rendered_html = template.render(error_message="Passwords doesn't match")  # aqui ele colocar a msg de erro
        return HTMLResponse(content=rendered_html)


#inicia o server
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
    
#so consegui fazer isso por causa da biblioteca template, foi ideia do chat mas eu sei como funciona