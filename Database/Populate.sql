USE SysCall;

-- Insert some roles, so Employee can reference them (not present in your old data)
-- Assuming idRole for 'User' will be 1, 'Technician' will be 2, 'System Administrator' will be 3 due to AUTO_INCREMENT
INSERT INTO Role (Role) VALUES ('User'), ('Technician'), ('System Administrator');

INSERT INTO Priority (Priority) VALUES ('Baixa'), ('Media'), ('Alta');

-- Insert users  
INSERT INTO User (Username, Email, NameSurname, CPF, Number, Password, fk_Role_idRole)
VALUES 
('johndoe', 'johndoe@example.com', 'John Doe', '12345678901', '1234567890', MD5('Password1@'), 1),
('janedoe', 'janedoe@example.com', 'Jane Doe', '10987654321', '0987654321', MD5('Password2@'), 1),
('user', 'user@example.com', 'user', '46252718009', '1234567890', MD5('123'), 1),
('tecnico', 'tech@example.com', 'tech', '40508016045', '0987654321', MD5('123'), 2),
('admin', 'adm@example.com', 'admin', '99218718037', '0987654321', MD5('123'), 3);

-- Insert addresses for these users
-- Assuming johndoe is idUser 1, janedoe is 2, user is 3, tecnico is 4, admin is 5
INSERT INTO Address (Address, fk_User_idUser, CEP)
VALUES  
('123 Main St', 1, '12345678'),
('456 Another Rd', 2, '12345678'),
('789 User Ave', 3, '87654321'),
('101 Tech Blvd', 4, '87654321'),
('202 Admin Ct', 5, '87654321');

-- Insert some complements for these users' addresses  
-- Assuming address for johndoe is idAddress 1, janedoe is 2, user is 3, tecnico is 4, admin is 5
INSERT INTO Complement (Complement, fk_Address_idAddress)
VALUES  
('Apt. 101', 1),
('Suite 205', 2),
('Unit A', 3),
('Bldg B', 4),
('Floor 5', 5); 

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
INSERT INTO Issue (Title, Description, fk_User_idUser, fk_IssueProgress_idIssueProgress, fk_IssueType_idIssueType,fk_Priority_idPriority)
VALUES 
('Issue with login functionality', 'User cannot login due to incorrect password validation.', 1, 1, 1,1),
('Request for new feature', 'Would like to see a dark mode feature implemented.', 2, 2, 2, 2),
('System slow on user login', 'User reports system is slow after login.', 3, 1, 1, 1),
('Cannot access technician panel', 'Technician unable to access specific panel.', 4, 1, 1, 1),
('Admin dashboard not loading', 'Admin dashboard shows blank page.', 5, 1, 1, 1);

-- Insert issue history  
INSERT INTO IssueHistory (fk_Issue_idIssue, Title, Description, fk_IssueProgress_idIssueProgress)
VALUES  
(1, 'Initial Report', 'Report submitted by user.', 1),
(2, 'Feature Request Submitted', 'Feature request registered.', 2),
(3, 'Slowness Reported', 'User reported slowness.', 1),
(4, 'Panel Access Issue', 'Technician reported panel access problem.', 1),
(5, 'Dashboard Load Failure', 'Admin reported dashboard not loading.', 1);