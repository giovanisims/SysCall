USE SysCall;

INSERT INTO User (idUser, Username, Email, NameSurname, CPF, Number, CEP, fk_Address_idAddress, Complement, Password)
VALUES 
(1, 'jdoe', 'jdoe@example.com', 'John Doe', 12345678901, 987654321, 1234567, 1, NULL, 'password123'),
(2, 'asmith', 'asmith@example.com', 'Alice Smith', 23456789012, 123456789, 2345678, 2, 1, 'password123');

-- Populate Complement Table  
INSERT INTO Complement (idComplement, Complement, fk_User_idUser)
VALUES 
(1, 'Apartment 101', 2);

-- Populate Address Table  
INSERT INTO Address (idAddress, Address, fk_Complement_IdComplement, fk_User_idUser)
VALUES  
(1, '1234 Elm Street', NULL, 1),
(2, '5678 Oak Avenue', 1, 2);

-- Populate Company Table  
INSERT INTO Company (idCompany, CompanyName)
VALUES  
(1, 'Tech Solutions Inc.'),
(2, 'Innovative Widgets LLC');

-- Populate IssueProgress Table  
INSERT INTO IssueProgress (idIssueProgress, StateName)
VALUES  
(1, 'Open'),
(2, 'In Progress'),
(3, 'Resolved'),
(4, 'Closed');

-- Populate IssueType Table  
INSERT INTO IssueType (idIssueType, StateName)
VALUES  
(1, 'Bug'),
(2, 'Feature Request'),
(3, 'Support Inquiry');

-- Populate Issue Table  
INSERT INTO Issue (idIssue, Title, Description, fk_User_idUser, fk_IssueProgress_idIssueProgress, fk_IssueType_idIssueType)
VALUES  
(1, 'Login Issue', 'Cannot log into account.', 1, 1, 1),
(2, 'Feature Request', 'Add dark mode to the app.', 2, 1, 2);

-- Populate IssueHistory Table  
INSERT INTO IssueHistory (idStateHistory, fk_Issue_idIssue, Title, Description, fk_IssueProgress, fk_ChangedByUser)
VALUES  
(1, 1, 'Login Issue', 'Cannot log into account.', 1, 1),
(2, 2, 'Feature Request', 'Add dark mode to the app.', 1, 2);

-- Populate Evaluates Table  
INSERT INTO Evaluates (fk_Issue_idIssue, fk_Company_idCompany)
VALUES  
(1, 1),
(2, 2);