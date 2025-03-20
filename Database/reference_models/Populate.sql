-- Use the SysCall database  
USE SysCall;

-- Insert sample data into the User table  
INSERT INTO User (idUser, Username, Password) VALUES  
(1, 'alice', 'password123'),
(2, 'bob', 'securepass'),
(3, 'charlie', 'mypass');

-- Insert sample data into the Company table  
INSERT INTO Company (idCompany, CompanyName) VALUES  
(1, 'Tech Solutions'),
(2, 'Innovatech'),
(3, 'SoftServe');

-- Insert sample data into the IssueState table  
INSERT INTO IssueState (idIssueState, StateName) VALUES  
(1, 'Resolved'),
(2, 'Unresolved'),
(3, 'Resolving');

-- Insert sample data into the Issue table  
INSERT INTO Issue (idIssue, Title, Description, fk_User_idUser, CurrentState, CreatedDate) VALUES  
(1, 'Website Down', 'The company website is not accessible.', 1, 2, '2023-10-01 10:00:00'),
(2, 'Email Issues', 'Unable to send emails through the company server.', 2, 3, '2023-10-02 11:30:00'),
(3, 'Bug in Software', 'The application crashes on launching.', 3, 1, '2023-10-03 12:45:00');

-- Insert sample data into the IssueHistory table  
INSERT INTO IssueHistory (idStateHistory, fk_Issue_idIssue, fk_IssueState, ChangedDate, fk_ChangedByUser) VALUES  
(1, 1, 2, '2023-10-01 11:00:00', 1),
(2, 1, 3, '2023-10-01 15:00:00', 2),
(3, 1, 1, '2023-10-02 09:00:00', 3),
(4, 2, 3, '2023-10-02 14:00:00', 2),
(5, 3, 1, '2023-10-04 08:00:00', 1);

-- Insert sample data into the Evaluates table  
INSERT INTO Evaluates (fk_Issue_idIssue, fk_Company_idCompany) VALUES  
(1, 1),
(2, 2),
(3, 3);