USE SysCall;

-- Insert some roles, so Employee can reference them (not present in your old data)
INSERT INTO Role (Role) VALUES ('User'), ('Technician'), ('System Administrator');

-- Insert users  
INSERT INTO User (Username, Email, NameSurname, CPF, Number, Password)
VALUES 
('johndoe', 'johndoe@example.com', 'John Doe', '12345678901', '1234567890', MD5('Password1@')),
('janedoe', 'janedoe@example.com', 'Jane Doe', '10987654321', '0987654321', MD5('Password2@'));

-- Insert addresses for these users  
INSERT INTO Address (Address, fk_User_idUser, CEP)
VALUES  
('123 Main St', 1, 12345678),
('456 Another Rd', 2, 12345678);

-- Insert some complements for these users' addresses  
INSERT INTO Complement (Complement, fk_Address_idAddress)
VALUES  
('Apt. 101', 1),
('Suite 205', 2); 

-- Insert issue progress states  
INSERT INTO IssueProgress (StateName)
VALUES 
('Open'),
('In Progress'),
('Closed');

-- Insert issue types  
INSERT INTO IssueType (StateName)
VALUES 
('Bug'),
('Feature Request'),
('Task');

-- Insert issues associated with the users  
INSERT INTO Issue (Title, Description, fk_User_idUser, fk_IssueProgress_idIssueProgress, fk_IssueType_idIssueType)
VALUES 
('Issue with login functionality', 'User cannot login due to incorrect password validation.', 1, 1, 1),
('Request for new feature', 'Would like to see a dark mode feature implemented.', 2, 2, 2);

-- Insert issue history  
INSERT INTO IssueHistory (fk_Issue_idIssue, Title, Description, fk_IssueProgress_idIssueProgress)
VALUES  
(1, 'Initial Report', 'Report submitted by user.', 1),
(2, 'Feature Request Submitted', 'Feature request registered.', 2);
