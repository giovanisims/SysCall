const tableBody = document.getElementById('users-table-body');
const deleteModal = document.getElementById('confirmationModal');
const confirmBtn = document.getElementById('confirmDeleteBtn');
const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
const editModal = document.getElementById('editUserModal');
const editForm = document.getElementById('editUserForm');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const editErrorMsg = document.getElementById('editError');
const successModal = document.getElementById('successModal');
const closeSuccessBtn = document.getElementById('closeSuccessBtn');
const successMessageText = document.getElementById('successMessageText');

let deleteUrl = null; // To store the URL for deletion

// --- Fetch and Populate Table ---
async function fetchUsers() {
    try {
        const response = await fetch('/users');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const users = await response.json();
        tableBody.innerHTML = '';

        users.forEach(user => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${user.idUser}</td>
                <td>${user.Username}</td>
                <td>${user.NameSurname}</td>
                <td>${user.Email}</td>
                <td>${user.CPF || ''}</td>
                <td>${user.Number || ''}</td>
                <td>${user.CEP || ''}</td>
                <td>${user.Address || ''}</td>
                <td>${user.Complement || ''}</td>
                <td class="action-button">
                    <a href="#" class="edit-link" data-user-id="${user.idUser}">
                        <i class="fa-solid fa-pen-to-square" style="color: #125dde;"></i>
                    </a>
                </td>
                <td class="action-button">
                    <a href="#" class="delete-link" data-delete-url="/delete_user?user_id=${user.idUser}">
                        <i class="fa-solid fa-trash" style="color: #921f1f;"></i>
                    </a>
                </td>
            `;
            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error("Failed to fetch users:", error);
        tableBody.innerHTML = '<tr><td colspan="11">Erro ao carregar usuários.</td></tr>';
    }
}

// --- Delete Modal Logic ---
function showDeleteModal(url) {
    deleteUrl = url;
    deleteModal.style.display = 'block';
}

function hideDeleteModal() {
    deleteModal.style.display = 'none';
    deleteUrl = null;
}

confirmBtn.addEventListener('click', () => {
    if (deleteUrl) {
        // Instead of immediate redirect, trigger the delete request from JS
        // This allows handling the response (like showing the success modal)
        // For now, we'll keep the redirect approach as implemented in main.py
        // but a fetch approach here would be more robust for SPA-like behavior.
        window.location.href = deleteUrl;
    }
    hideDeleteModal();
});

cancelDeleteBtn.addEventListener('click', hideDeleteModal);

// --- Edit Modal Logic ---
function showEditModal() {
    editErrorMsg.style.display = 'none'; // Hide previous errors
    editModal.style.display = 'block';
}

function hideEditModal() {
    editModal.style.display = 'none';
    editForm.reset(); // Clear the form
}

async function openEditModal(userId) {
    try {
        const response = await fetch(`/user/${userId}`); // Fetch specific user data
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const user = await response.json();

        if (user.error) { // Handle backend error response
             console.error("Error fetching user data:", user.error);
             alert(`Erro ao buscar dados do usuário: ${user.error}`);
             return;
        }


        // Populate the form
        document.getElementById('editUserId').value = user.idUser;
        document.getElementById('editUsername').value = user.Username || '';
        document.getElementById('editNameSurname').value = user.NameSurname || '';
        document.getElementById('editEmail').value = user.Email || '';
        document.getElementById('editCPF').value = user.CPF || '';
        document.getElementById('editNumber').value = user.Number || '';
        document.getElementById('editCEP').value = user.CEP || '';
        document.getElementById('editAddress').value = user.Address || '';
        document.getElementById('editComplement').value = user.Complement || '';

        showEditModal();
    } catch (error) {
        console.error("Failed to fetch user data for edit:", error);
        alert("Não foi possível carregar os dados do usuário para edição.");
    }
}

editForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    editErrorMsg.style.display = 'none';

    const userId = document.getElementById('editUserId').value;
    const formData = new FormData(editForm);
    const data = Object.fromEntries(formData.entries());

    try {
        const response = await fetch(`/update_user/${userId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        const result = await response.json();

        if (!response.ok || result.error) {
            throw new Error(result.error || `HTTP error! status: ${response.status}`);
        }

        hideEditModal();
        fetchUsers(); // Refresh table
        showSuccessModal('Usuário atualizado com sucesso!'); // Show success popup

    } catch (error) {
        console.error("Failed to update user:", error);
        editErrorMsg.textContent = `Erro ao atualizar: ${error.message}`;
        editErrorMsg.style.display = 'block';
    }
});

cancelEditBtn.addEventListener('click', hideEditModal);

// --- Success Modal Logic ---
function showSuccessModal(message) {
    successMessageText.textContent = message; // Set the message text
    successModal.style.display = 'block';
}

function hideSuccessModal() {
    successModal.style.display = 'none';
}

closeSuccessBtn.addEventListener('click', hideSuccessModal);

// --- Event Delegation for Table Actions ---
tableBody.addEventListener('click', (event) => {
    const target = event.target;
    const deleteLink = target.closest('.delete-link');
    const editLink = target.closest('.edit-link');

    if (deleteLink) {
        event.preventDefault();
        const url = deleteLink.getAttribute('data-delete-url');
        showDeleteModal(url);
    } else if (editLink) {
        event.preventDefault();
        const userId = editLink.getAttribute('data-user-id');
        openEditModal(userId);
    }
});

// --- Close Modals on Outside Click ---
window.addEventListener('click', (event) => {
    if (event.target === deleteModal) {
        hideDeleteModal();
    }
    if (event.target === editModal) {
        hideEditModal();
    }
    if (event.target === successModal) {
        hideSuccessModal();
    }
});

// --- Initial Load ---
document.addEventListener('DOMContentLoaded', () => {
    fetchUsers(); // Load users initially

    // Check for the delete success flag in the URL
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('deleted') && urlParams.get('deleted') === 'true') {
        showSuccessModal('Usuário excluído com sucesso!');
        // Remove the query parameter from the URL without reloading the page
        const newUrl = window.location.pathname + window.location.hash; // Keep hash if exists
        history.replaceState(null, '', newUrl);
    }
});