from sqlalchemy import Column, Integer, String, ForeignKey, DateTime  
from sqlalchemy.orm import relationship  
from database import Base

class User(Base):
    __tablename__ = "User"

    idUser = Column(Integer, primary_key=True, index=True)
    Username = Column(String(255), unique=True, nullable=False)
    Password = Column(String(255), nullable=False)


class Company(Base):
    __tablename__ = "Company"

    idCompany = Column(Integer, primary_key=True, index=True)
    CompanyName = Column(String(255), nullable=False)


class IssueProgress(Base):
    __tablename__ = "IssueProgress"

    idIssueProgress = Column(Integer, primary_key=True, index=True)
    StateName = Column(String(255), unique=True, nullable=False)


class IssueType(Base):
    __tablename__ = "IssueType"

    idIssueType = Column(Integer, primary_key=True, index=True)
    StateName = Column(String(255), unique=True, nullable=False)


class Issue(Base):
    __tablename__ = "Issue"

    idIssue = Column(Integer, primary_key=True, index=True)
    Title = Column(String(255), nullable=False)
    Description = Column(String)
    CreatedDate = Column(DateTime, nullable=False)
    fk_User_idUser = Column(Integer, ForeignKey('User.idUser'), nullable=False)
    fk_IssueProgress_idIssueProgress = Column(Integer, ForeignKey('IssueProgress.idIssueProgress'), nullable=False)
    fk_IssueType_idIssueType = Column(Integer, ForeignKey('IssueType.idIssueType'), nullable=False)

    user = relationship("User")
    progress = relationship("IssueProgress")
    type = relationship("IssueType")


class IssueHistory(Base):
    __tablename__ = "IssueHistory"

    idStateHistory = Column(Integer, primary_key=True, index=True)
    fk_Issue_idIssue = Column(Integer, ForeignKey('Issue.idIssue'), nullable=False)
    fk_IssueProgress = Column(Integer, ForeignKey('IssueProgress.idIssueProgress'), nullable=False)
    ChangedDate = Column(DateTime, nullable=False)
    fk_ChangedByUser = Column(Integer, ForeignKey('User.idUser'), nullable=False)

    issue = relationship("Issue")
    issue_progress = relationship("IssueProgress")
    changed_by_user = relationship("User")


class Evaluates(Base):
    __tablename__ = "Evaluates"

    fk_Issue_idIssue = Column(Integer, ForeignKey('Issue.idIssue'), primary_key=True)
    fk_Company_idCompany = Column(Integer, ForeignKey('Company.idCompany'), primary_key=True)
