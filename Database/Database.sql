DROP DATABASE IF EXISTS SysCall;
CREATE DATABASE IF NOT EXISTS SysCall;
USE SysCall;

CREATE TABLE Role (
	idRole INT PRIMARY KEY AUTO_INCREMENT,
    Role VARCHAR(255)
);

CREATE TABLE Priority (
    idPriority INT PRIMARY KEY AUTO_INCREMENT,
    Priority VARCHAR(255) 
);

CREATE TABLE User (
    idUser INT PRIMARY KEY AUTO_INCREMENT,
    Username VARCHAR(255) UNIQUE NOT NULL,
    Email VARCHAR(255) UNIQUE NOT NULL,
    NameSurname VARCHAR(255) NOT NULL,
    CPF VARCHAR(11) NOT NULL,
    Number VARCHAR(11) NOT NULL,
    Password VARCHAR(32) NOT NULL,
    fk_Role_idRole INT,
    FOREIGN KEY (fk_Role_idRole) REFERENCES Role(idRole) ON DELETE CASCADE
);


CREATE TABLE Address (
    idAddress INT PRIMARY KEY AUTO_INCREMENT,
    Address VARCHAR(255) NOT NULL,
    CEP VARCHAR(8)NOT NULL,
    fk_User_idUser INT NOT NULL,
    FOREIGN KEY (fk_User_idUser) REFERENCES User(idUser)
);

CREATE TABLE Complement(
    idComplement INT PRIMARY KEY AUTO_INCREMENT,
    Complement VARCHAR(255),
    fk_Address_idAddress INT,
    FOREIGN KEY (fk_Address_idAddress) REFERENCES Address(idAddress) ON DELETE CASCADE
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
    fk_IssueProgress_idIssueProgress INT DEFAULT(1) NOT NULL,
    fk_IssueType_idIssueType INT,
    fk_Priority_idPriority INT,
    FOREIGN KEY (fk_User_idUser) REFERENCES User(idUser) ON DELETE SET NULL,
    FOREIGN KEY (fk_IssueProgress_idIssueProgress) REFERENCES IssueProgress(idIssueProgress),
    FOREIGN KEY (fk_IssueType_idIssueType) REFERENCES IssueType(idIssueType),
    FOREIGN KEY (fk_Priority_idPriority) REFERENCES Priority(idPriority)
);

CREATE TABLE IssueHistory (
    idStateHistory INT PRIMARY KEY AUTO_INCREMENT,
    fk_Issue_idIssue INT NOT NULL,
    Title VARCHAR(255) NOT NULL,
    Description TEXT NOT NULL,
    fk_IssueProgress_idIssueProgress INT NOT NULL DEFAULT(2),
    ChangedDate DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (fk_Issue_idIssue) REFERENCES Issue(idIssue) ON DELETE CASCADE,
    FOREIGN KEY (fk_IssueProgress_idIssueProgress) REFERENCES IssueProgress(idIssueProgress)
);
