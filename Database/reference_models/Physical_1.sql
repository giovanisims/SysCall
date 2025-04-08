DROP DATABASE IF EXISTS SysCall;
CREATE DATABASE IF NOT EXISTS SysCall;
USE SysCall;

CREATE TABLE User (
    idUser INT PRIMARY KEY,
    Username VARCHAR(255) UNIQUE NOT NULL,
    Email VARCHAR(255) UNIQUE NOT NULL,
    NameSurname VARCHAR(255) NOT NULL,
    CPF INTEGER(11) NOT NULL,
    Number INTEGER(9) NOT NULL,
    CEP INTEGER(7) NOT NULL,
    Password VARCHAR(255) NOT NULL,
    Address VARCHAR(255),
    Complement VARCHAR(255)
);

CREATE TABLE Company (
    idCompany INT PRIMARY KEY,
    CompanyName VARCHAR(255) NOT NULL  
);

CREATE TABLE IssueProgress (
    idIssueProgress INT PRIMARY KEY,
    StateName VARCHAR(255) UNIQUE NOT NULL  
);

CREATE TABLE IssueType (
    idIssueType INT PRIMARY KEY,
    StateName VARCHAR(255) UNIQUE NOT NULL  
);

CREATE TABLE Issue (
    idIssue INT PRIMARY KEY,
    Title VARCHAR(255) NOT NULL, 
    Description TEXT,
    CreatedDate DATETIME DEFAULT CURRENT_TIMESTAMP,
    fk_User_idUser INT NOT NULL,
    fk_IssueProgress_idIssueProgress INT NOT NULL,
    fk_IssueType_idIssueType INT NOT NULL,
    FOREIGN KEY (fk_User_idUser) REFERENCES User(idUser),
    FOREIGN KEY (fk_IssueProgress_idIssueProgress) REFERENCES IssueProgress(idIssueProgress),
    FOREIGN KEY (fk_IssueType_idIssueType) REFERENCES IssueType(idIssueType)
);

CREATE TABLE IssueHistory (
    idStateHistory INT PRIMARY KEY,
    fk_Issue_Title VARCHAR(255) NOT NULL,
    fk_Issue_Description TEXT NOT NULL,
    fk_Issue_idIssue INT NOT NULL,
    fk_IssueProgress INT NOT NULL,
    fk_ChangedByUser INT NOT NULL,
    ChangedDate DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (fk_Issue_Title) REFERENCES Issue(Title),
    FOREIGN KEY (fk_Issue_Description) REFERENCES Issue(Description),
    FOREIGN KEY (fk_Issue_idIssue) REFERENCES Issue(idIssue),
    FOREIGN KEY (fk_IssueProgress) REFERENCES IssueProgress(idIssueProgress),
    FOREIGN KEY (fk_ChangedByUser) REFERENCES User(idUser)
);

CREATE TABLE Evaluates (
    fk_Issue_idIssue INT NOT NULL,
    fk_Company_idCompany INT NOT NULL,
    PRIMARY KEY (fk_Issue_idIssue, fk_Company_idCompany),
    FOREIGN KEY (fk_Issue_idIssue) REFERENCES Issue(idIssue) ON DELETE CASCADE,
    FOREIGN KEY (fk_Company_idCompany) REFERENCES Company(idCompany) ON DELETE CASCADE
);