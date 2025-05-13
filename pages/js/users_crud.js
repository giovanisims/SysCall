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
const editPasswordInput = document.getElementById('editPassword');
const editSeePasswordCheckbox = document.getElementById('editSeePassword');
const errorPasswordEdit = document.getElementById('errorPasswordEdit');

let deleteUrl = null; // To store the URL for deletion

// --- Fetch and Populate Table ---
// ...existing code...
async function fetchUsers() {
    try {
        const response = await fetch('/users');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const users = await response.json();
        tableBody.innerHTML = '';
        console.log(users) // Verifique aqui no console do navegador a estrutura exata de 'users'
        users.forEach(user => {
            const row = document.createElement('tr');
            // Add data-label attributes matching the headers
            row.innerHTML = `
                <td data-label="ID">${user.idUser}</td>
                <td data-label="Username">${user.Username }</td>
                <td data-label="Nome Completo">${user.NameSurname}</td>
                <td data-label="Email">${user.Email}</td>
                <td data-label="CPF">${formatCPF(user.CPF)}</td>
                <td data-label="Telefone">${formatPhoneNumber(user.Number)}</td>
                <td data-label="CEP">${user.CEP ? formatCEP(user.CEP) : ''}</td>
                <td data-label="Endereço">${user.Address && user.Address.Address ? user.Address.Address : ''}</td>
                <td data-label="Complemento">${user.Address && user.Address.Complement ? user.Address.Complement : ''}</td>
                <td class="action-button" data-label="Ações">
                    <a href="#" class="edit-link" data-user-id="${user.idUser}">
                        <i class="fa-solid fa-pen-to-square" style="color: #125dde;"></i>
                    </a>
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
        document.getElementById('editName').value = user.Username || '';
        document.getElementById('editSurname').value = user.NameSurname || '';
        document.getElementById('editEmail').value = user.Email || '';
        document.getElementById('editCPF').value = formatCPF(user.CPF || '');
        document.getElementById('editNumber').value = formatPhoneNumber(user.Number || '');
        document.getElementById('editCEP').value = formatCEP(user.CEP || '');
        document.getElementById('editAddress').value = user.Address || '';
        document.getElementById('editComplement').value = user.Complement || '';
        document.getElementById('editPassword').value = ''; // Ensure password field is empty

        // Remove previous listeners to avoid duplicates if modal is reopened
        document.getElementById('submitButtonVisible').removeEventListener('click', validateForm);
        document.getElementById('editCEP').removeEventListener('blur', searchAddress);
        document.getElementById('editCPF').removeEventListener('blur', formatAndValidateCPF);
        document.getElementById('editNumber').removeEventListener('blur', formatPhone);
        editPasswordInput.removeEventListener('blur', validatePasswordEdit);
        editSeePasswordCheckbox.removeEventListener('change', togglePasswordVisibilityEdit);


        // Add event listeners
        document.getElementById('submitButtonVisible').addEventListener('click', validateForm);
        document.getElementById('editCEP').addEventListener('blur', searchAddress);
        document.getElementById('editCPF').addEventListener('blur', formatAndValidateCPF);
        document.getElementById('editNumber').addEventListener('blur', formatPhone);
        editPasswordInput.addEventListener('blur', validatePasswordEdit); // Add listener for password validation
        editSeePasswordCheckbox.addEventListener('change', togglePasswordVisibilityEdit); // Add listener for show/hide password


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
    // const data = Object.fromEntries(formData.entries()); // Original problematic line

    // --- Construct the data object with keys matching the Pydantic model ---
    const data = {
        Username: formData.get('editName'),
        NameSurname: formData.get('editSurname'),
        Email: formData.get('editEmail'),
        // Send raw digits for validation on the backend
        CPF: formData.get('cpf').replace(/\D/g, ''),
        Number: formData.get('number').replace(/\D/g, ''),
        CEP: formData.get('cep').replace(/\D/g, ''),
        Address: formData.get('address'),
        Complement: formData.get('complement') || null // Send null if empty
    };

    // Only include password if it's not empty
    const newPassword = formData.get('editPassword');
    if (newPassword && newPassword.trim() !== '') {
        data.Password = newPassword; // Add password to the data object
    }
    // --- End of change ---

    try {
        const response = await fetch(`/update_user/${userId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data), // Send the correctly structured data
        });

        // console.log(response) // Keep for debugging if needed
        const result = await response.json();
        // console.log(result) // Keep for debugging if needed

        if (!response.ok) { // Check response.ok instead of result.error first
            // Use the error message from the backend if available
            throw new Error(result.detail || result.error || `HTTP error! status: ${response.status}`);
        }

        hideEditModal();
        fetchUsers(); // Refresh table
        showSuccessModal('Usuário atualizado com sucesso!'); // Show success popup

    } catch (error) {
        console.error("Failed to update user:", error);
        // Display the specific error message from the backend or the fetch error
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


function formatCPF(cpf) {
    if (!cpf) return '';
    
    // Remove any non-digit character
    cpf = cpf.replace(/\D/g, '');
    
    if (cpf.length !== 11) return cpf;
    
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

function formatPhoneNumber(number) {
    if (!number) return '';
    number = number.replace(/\D/g, '');
    
    if (number.length === 11) {
        return number.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    } else if (number.length === 10) {
        return number.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return number;
}

function formatCEP(cep) {
    if (!cep) return '';
    
    cep = cep.replace(/\D/g, '');
 
    if (cep.length !== 8) return cep;

    return cep.replace(/(\d{5})(\d{3})/, '$1-$2');
}

// --- Form Validation Logic ---

function validateForm() {
    resetErrorMessages();
    var fieldsValid = validateEmptyFields();
    var passwordValid = true; // Assume valid if empty

    // Only validate password if the field is not empty
    if (editPasswordInput.value.trim() !== '') {
        passwordValid = validatePasswordEdit();
    }

    if (fieldsValid && passwordValid) {
        document.getElementById("submitButton").click();
    }
}

function resetErrorMessages() {
    document.getElementById("errorFields").style.display = 'none';
    errorPasswordEdit.style.display = 'none'; // Reset password error
    // Reset other specific errors if needed (CEP, CPF, etc.)
    document.getElementById("errorCep").style.display = 'none';
    document.getElementById("errorCpf").style.display = 'none';
    document.getElementById("errorPhone").style.display = 'none';
    // Remove error classes
    const errorFields = editForm.querySelectorAll('.error, .empty-field');
    errorFields.forEach(field => field.classList.remove('error', 'empty-field'));
}

function validateEmptyFields() {
    var requiredFields = document.getElementsByClassName("required");
    var requiredFieldsArray = Array.from(requiredFields);
    var hasEmptyFields = false;

    if (requiredFieldsArray.length > 0) {
        requiredFieldsArray.forEach(field => {
            if (!field.value || field.value.trim() === "") {
                console.log("campo obrigatório");
                field.classList.add("empty-field");
                hasEmptyFields = true;
            } else {
                field.classList.remove("empty-field");
            }
        });

        if (hasEmptyFields) {
            document.getElementById("errorFields").style.display = 'block';
            return false;
        }
    }
    return true;
}

function searchAddress() {
    let cep = document.getElementById("editCEP").value;
    let rawCep = cep.replace(/\D/g, "");

    if (rawCep.length === 8) {
        let formattedCep = rawCep.replace(/^(\d{2})(\d{3})(\d{3})$/, "$1.$2-$3");
        document.getElementById("editCEP").value = formattedCep;

        let url = `https://viacep.com.br/ws/${rawCep}/json/`;

        fetch(url)
            .then(response => response.json())
            .then(data => {
                if (!("erro" in data)) {
                    document.getElementById("editAddress").value = data.logradouro;
                } else {
                    document.getElementById("editCEP").classList.add("error");
                document.getElementById("errorCep").style.display = 'block';
                }
            })
            .catch(error => {
                document.getElementById("editCEP").classList.add("error");
                document.getElementById("errorCep").style.display = 'block';
            });
            document.getElementById("errorCep").style.display = 'none';
            document.getElementById("editCEP").classList.remove("error");
            document.getElementById("editCEP").classList.remove("empty-field");
    } else {
        document.getElementById("editCEP").classList.add("error");
        document.getElementById("errorCep").style.display = 'block';
    }
}

function formatAndValidateCPF() {
    let cpf = document.getElementById("editCPF").value;
    let formattedCpf = cpf.replace(/\D/g, "");

    if (formattedCpf.length <= 11) {
        formattedCpf = cpf.replace(/^(\d{3})(\d{3})(\d{3})(\d{0,2})$/, "$1.$2.$3-$4");
    }

    document.getElementById("editCPF").value = formattedCpf;

    let cleanCpf = cpf.replace(/\D/g, "");
    let isValid = true;

    if (cleanCpf.length !== 11) {
        isValid = false;
    } else if (/^(\d)\1+$/.test(cleanCpf)) {
        isValid = false;
    } else {
        let sum = 0, remainder;
        for (let i = 1; i <= 9; i++) sum += parseInt(cleanCpf[i - 1]) * (11 - i);
        remainder = (sum * 10) % 11;
        if (remainder === 10 || remainder === 11) remainder = 0;
        if (remainder !== parseInt(cleanCpf[9])) isValid = false;

        if (isValid) {
            sum = 0;
            for (let i = 1; i <= 10; i++) sum += parseInt(cleanCpf[i - 1]) * (12 - i);
            remainder = (sum * 10) % 11;
            if (remainder === 10 || remainder === 11) remainder = 0;
            if (remainder !== parseInt(cleanCpf[10])) isValid = false;
        }
    }

    if (!isValid) {
        document.getElementById("editCPF").classList.add("error");
        document.getElementById("errorCpf").style.display = 'block';
    } else {
        document.getElementById("editCPF").classList.remove("error");
        document.getElementById("editCPF").classList.remove("empty-field");
        document.getElementById("errorCpf").style.display = 'none';
    }
}


function formatPhone() {
    let phone = document.getElementById("editNumber").value;
    let cleanPhone = phone.replace(/\D/g, "");
    
    document.getElementById("errorPhone").style.display = 'none';
    document.getElementById("editNumber").classList.remove("error");
    document.getElementById("editNumber").classList.remove("empty-field");
    
    if (cleanPhone.length === 11) {
        document.getElementById("editNumber").value = cleanPhone.replace(/^(\d{2})(\d{5})(\d{4})$/, "($1) $2-$3");
    } else if (cleanPhone.length === 10) {
        document.getElementById("editNumber").value = cleanPhone.replace(/^(\d{2})(\d{4})(\d{4})$/, "($1) $2-$3");
    } else if (cleanPhone.length === 9) {
        document.getElementById("editNumber").value = cleanPhone.replace(/^(\d{5})(\d{4})$/, "$1-$2");
    } else if (cleanPhone.length > 0) {
        document.getElementById("errorPhone").style.display = 'block';
        document.getElementById("editNumber").classList.add("error");
    }
}

// Add password validation function for the edit form
function validatePasswordEdit() {
    const password = editPasswordInput.value;
    // If password field is empty, it's considered valid (no change)
    if (!password || password.trim() === '') {
        editPasswordInput.classList.remove("error");
        errorPasswordEdit.style.display = 'none';
        return true;
    }

    // Regex: At least 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
    const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*\W).{8,}$/;
    if (!passwordRegex.test(password)) {
        editPasswordInput.classList.add("error");
        errorPasswordEdit.style.display = 'block';
        return false;
    } else {
        editPasswordInput.classList.remove("error");
        errorPasswordEdit.style.display = 'none';
        return true;
    }
}

// Add function to toggle password visibility in the edit form
function togglePasswordVisibilityEdit() {
    if (editSeePasswordCheckbox.checked) {
        editPasswordInput.type = 'text';
    } else {
        editPasswordInput.type = 'password';
    }
}

