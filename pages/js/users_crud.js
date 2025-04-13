async function fetchUsers() {
    const response = await fetch('http://127.0.0.1:8000/users'); 
    const users = await response.json(); //transforma o banco de dados num JSON
    const tableBody = document.getElementById('users-table-body'); // escolhe a tabela (so tem uma mas enfim ne)
    tableBody.innerHTML = ''; //limpa a tabela antes de preencher (so precavendo)

    // monta cada linha
    users.forEach(user => {
        const row = `<tr>
            <td>${user.idUser}</td>
            <td>${user.Username}</td>
            <td>${user.NameSurname}</td>
            <td>${user.Email}</td>
            <td>${user.CPF}</td>
            <td>${user.Number}</td>
            <td>${user.CEP}</td>
            <td>${user.Complement || ''}</td>
            <td class="action-button"><a href="edit_user?user_id=${user.idUser}"><i class="fa-solid fa-pen-to-square" style="color: #125dde;"></i></a></td>
            <td class="action-button"><a href="delete_user?user_id=${user.idUser}"><i class="fa-solid fa-trash" style="color: #921f1f;"></i></a></td>
        </tr>`;
        tableBody.innerHTML += row;
    });
}

document.addEventListener('DOMContentLoaded', fetchUsers);