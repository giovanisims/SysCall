from sqlalchemy import create_engine  
from sqlalchemy.ext.declarative import declarative_base  
from sqlalchemy.orm import sessionmaker

DATABASE_URL = "mysql+pymysql://root:PUC%401234@127.0.0.1:3305/SysCall"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

