from sqlalchemy import Column, Integer, String, ForeignKey, DATETIME  
from sqlalchemy.orm import relationship  
from database import Base

class User(Base):
    __tablename__ = "User"

    idUser = Column(Integer, primary_key=True, index=True)
    Username = Column(String(255), unique=True, nullable=False)
    Password = Column(String(255), nullable=False)

    issues = relationship("Issue", back_populates="user")
    history = relationship("IssueHistory", back_populates="changed_by_user")

class Company(Base):
    __tablename__ = "Company"

    idCompany = Column(Integer, primary_key=True, index=True)
    CompanyName = Column(String(255), nullable=False)

class IssueState(Base):
    __tablename__ = "IssueState"

    idIssueState = Column(Integer, primary_key=True, index=True)
    StateName = Column(String(255), unique=True, nullable=False)

class Issue(Base):
    __tablename__ = "Issue"

    idIssue = Column(Integer, primary_key=True, index=True)
    Title = Column(String(255), nullable=False)
    Description = Column(String)
    fk_User_idUser = Column(Integer, ForeignKey('User.idUser'), nullable=False)
    CurrentState = Column(Integer, ForeignKey('IssueState.idIssueState'), nullable=False)
    CreatedDate = Column(DATETIME, nullable=False)

    user = relationship("User", back_populates="issues")
    state = relationship("IssueState")
    history = relationship("IssueHistory", back_populates="issue")

class IssueHistory(Base):
    __tablename__ = "IssueHistory"

    idStateHistory = Column(Integer, primary_key=True, index=True)
    fk_Issue_idIssue = Column(Integer, ForeignKey('Issue.idIssue'), nullable=False)
    fk_IssueState = Column(Integer, ForeignKey('IssueState.idIssueState'), nullable=False)
    ChangedDate = Column(DATETIME, nullable=False)
    fk_ChangedByUser = Column(Integer, ForeignKey('User.idUser'), nullable=False)

    issue = relationship("Issue", back_populates="history")
    issue_state = relationship("IssueState")
    changed_by_user = relationship("User", back_populates="history")

class Evaluates(Base):
    __tablename__ = "Evaluates"

    fk_Issue_idIssue = Column(Integer, ForeignKey('Issue.idIssue'), primary_key=True)
    fk_Company_idCompany = Column(Integer, ForeignKey('Company.idCompany'), primary_key=True)