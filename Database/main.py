import os  
import sys

from fastapi import FastAPI, Depends  
from sqlalchemy.orm import Session  
import models, database

models.Base.metadata.create_all(bind=database.engine)

app = FastAPI()

def get_db():
    db = database.SessionLocal()
    try:
        yield db  
    finally:
        db.close()

# Sample Route  
@app.get("/users/")
def read_users(skip: int = 0, limit: int = 10, db: Session = Depends(get_db)):
    users = db.query(models.User).offset(skip).limit(limit).all()
    return users

# This code only runs if the script is executed directly, not if it is imported as a module.
if __name__ == "__main__":
    import uvicorn  
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)