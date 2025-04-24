DROP DATABASE IF EXISTS SysCall;
CREATE DATABASE IF NOT EXISTS SysCall;
USE SysCall;

CREATE TABLE User (
    idUser INT PRIMARY KEY AUTO_INCREMENT,
    Username VARCHAR(255) UNIQUE NOT NULL,
    Email VARCHAR(255) UNIQUE NOT NULL,
    NameSurname VARCHAR(255) NOT NULL,
    CPF VARCHAR(11) NOT NULL,
    Number VARCHAR(11) NOT NULL,
    CEP VARCHAR(8)NOT NULL,
    Password VARCHAR(32) NOT NULL
);


CREATE TABLE Address (
    idAddress INT PRIMARY KEY AUTO_INCREMENT,
    Address VARCHAR(255) NOT NULL,
    fk_User_idUser INT NOT NULL,
    FOREIGN KEY (fk_User_idUser) REFERENCES User(idUser)
);

CREATE TABLE Complement(
    idComplement INT PRIMARY KEY AUTO_INCREMENT,
    Complement VARCHAR(255),
    fk_Address_idAddress INT,
    FOREIGN KEY (fk_Address_idAddress) REFERENCES Address(idAddress) ON DELETE CASCADE
);

CREATE TABLE Company (
    idCompany INT PRIMARY KEY AUTO_INCREMENT,
    CompanyName VARCHAR(255) NOT NULL  
);

CREATE TABLE IssueProgress (
    idIssueProgress INT PRIMARY KEY AUTO_INCREMENT,
    StateName VARCHAR(255) UNIQUE NOT NULL  
);

CREATE TABLE IssueType (
    idIssueType INT PRIMARY KEY AUTO_INCREMENT,
    StateName VARCHAR(255) UNIQUE NOT NULL  
);

CREATE TABLE Issue (
    idIssue INT PRIMARY KEY AUTO_INCREMENT,
    Title VARCHAR(255) NOT NULL, 
    Description TEXT,
    CreatedDate DATETIME DEFAULT CURRENT_TIMESTAMP,
    fk_User_idUser INT,
    fk_IssueProgress_idIssueProgress INT NOT NULL,
    fk_IssueType_idIssueType INT NOT NULL,
    FOREIGN KEY (fk_User_idUser) REFERENCES User(idUser) ON DELETE SET NULL,
    FOREIGN KEY (fk_IssueProgress_idIssueProgress) REFERENCES IssueProgress(idIssueProgress),
    FOREIGN KEY (fk_IssueType_idIssueType) REFERENCES IssueType(idIssueType)
);

CREATE TABLE IssueHistory (
    idStateHistory INT PRIMARY KEY AUTO_INCREMENT,
    fk_Issue_idIssue INT NOT NULL,
    Title VARCHAR(255) NOT NULL,
    Description TEXT NOT NULL,
    fk_IssueProgress_idIssueProgress INT NOT NULL,
    ChangedDate DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (fk_Issue_idIssue) REFERENCES Issue(idIssue) ON DELETE CASCADE,
    FOREIGN KEY (fk_IssueProgress_idIssueProgress) REFERENCES IssueProgress(idIssueProgress)
);

CREATE TABLE Evaluates (
    fk_Issue_idIssue INT NOT NULL,
    fk_Company_idCompany INT NOT NULL,
    PRIMARY KEY (fk_Issue_idIssue, fk_Company_idCompany),
    FOREIGN KEY (fk_Issue_idIssue) REFERENCES Issue(idIssue) ON DELETE CASCADE,
    FOREIGN KEY (fk_Company_idCompany) REFERENCES Company(idCompany) ON DELETE CASCADE  
);