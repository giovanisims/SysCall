var EditSelector, AddSelector;

document.addEventListener('DOMContentLoaded', function () {
    // If there is a backend error in the Add User modal, open the modal and show the error
    const backendError = document.getElementById('backendAddError');
    if (backendError && backendError.textContent.trim() !== "" && backendError.style.display === 'block') {
        openModalForm();
        backendError.style.display = 'block';
    }

    // If there is a backend error in the Edit User modal, open the modal and show the error
    const backendEditError = document.getElementById('backendEditError');
    if (backendEditError && backendEditError.textContent.trim() !== "") {
        document.getElementById('editModal').style.display = 'block';
        backendEditError.style.display = 'block';
    }
    // Initialize the selectors for both forms
    EditSelector = loadEditSelectors();
    AddSelector = loadAddSelectors();
    
    // Set up event listeners
    setupEventListeners();
    
    // Format CPF, CEP, and phone numbers in the users table
    formatTableData();
    
    // Exibe modal de sucesso se a URL tiver ?deleted=true, ?added=true ou ?edited=true
    const successModal = document.getElementById("successModal");
    const successMsg = document.getElementById("successMessageText");
    const closeBtn = document.getElementById("closeSuccessBtn");
    const params = new URLSearchParams(window.location.search);

    let message = "";
    if (params.get("deleted") === "true") {
        message = "Usuário excluído com sucesso!";
    } else if (params.get("added") === "true") {
        message = "Usuário adicionado com sucesso!";
    } else if (params.get("edited") === "true") {
        message = "Usuário editado com sucesso!";
    }

    if (successModal && successMsg) {
        if (message) {
            successMsg.innerText = message;
            successModal.style.display = "block";
            if (closeBtn) {
                closeBtn.onclick = function() {
                    successModal.style.display = "none";
                    successMsg.innerText = "";
                    window.history.replaceState({}, document.title, window.location.pathname);
                };
            }
        } else {
            successModal.style.display = "none";
            successMsg.innerText = "";
        }
    }
});

// Load selectors for the Edit form
function loadEditSelectors() {
    return {
        // Form elements
        form: document.getElementById('editUserForm'),
        name: document.getElementById('editName'),
        username: document.getElementById('editUsername'),
        email: document.getElementById('editEmail'),
        cpf: document.getElementById('editCPF'),
        phone: document.getElementById('editPhone'),
        cep: document.getElementById('editCEP'),
        address: document.getElementById('editAddress'),
        observation: document.getElementById('editObservation'),
        role: document.getElementById('editRole'),
        password: document.getElementById('editPassword'),
        seePasswordCheckbox: document.getElementById('editSeePassword'),
        // Buttons
        submitButtonVisible: document.getElementById('editSubmitButtonVisible'),
        submitButton: document.getElementById('editSubmitButton'),
        // Error messages
        errorCep: document.getElementById('errorEditCep'),
        errorFields: document.getElementById('errorEditFields'),
        errorCpf: document.getElementById('errorEditCpf'),
        errorPhone: document.getElementById('errorEditPhone'),
        errorName: document.getElementById('errorEditName'),
        errorEmail: document.getElementById('errorEditEmail'),
        errorUsername: document.getElementById('errorEditUsername'),
        errorPassword: document.getElementById('errorEditPassword')
    };
}

// Load selectors for the Add form
function loadAddSelectors() {
    return {
        // Form elements
        form: document.getElementById('formUser'),
        name: document.getElementById('addName'),
        username: document.getElementById('addUsername'),
        email: document.getElementById('addEmail'),
        cpf: document.getElementById('addCPF'),
        phone: document.getElementById('addPhone'),
        cep: document.getElementById('addCEP'),
        address: document.getElementById('addAddress'),
        observation: document.getElementById('addObservation'),
        role: document.getElementById('addRole'),
        password: document.getElementById('addPassword'),
        passwordConfirm: document.getElementById('addPasswordConfirm'),
        seePasswordCheckbox: document.getElementById('addSeePassword'),
        // Buttons
        submitButtonVisible: document.getElementById('addSubmitButtonVisible'),
        submitButton: document.getElementById('addSubmitButton'),
        // Error messages
        errorCep: document.getElementById('errorAddCep'),
        errorFields: document.getElementById('errorAddFields'),
        errorCpf: document.getElementById('errorAddCpf'),
        errorPhone: document.getElementById('errorAddPhone'),
        errorName: document.getElementById('errorAddName'),
        errorEmail: document.getElementById('errorAddEmail'),
        errorUsername: document.getElementById('errorAddUsername'),
        errorPassword: document.getElementById('errorAddPassword'),
        errorEqualPasswords: document.getElementById('errorAddEqualPasswords')
    };
}

// Set up event listeners for both forms
function setupEventListeners() {
    // Edit form events
    if (EditSelector.cep) EditSelector.cep.addEventListener('blur', function() { searchAddress(EditSelector); });
    if (EditSelector.cpf) EditSelector.cpf.addEventListener('blur', function() { formatAndValidateCPF(EditSelector); });
    if (EditSelector.phone) EditSelector.phone.addEventListener('blur', function() { formatPhone(EditSelector); });
    if (EditSelector.name) EditSelector.name.addEventListener('blur', function() { validateName(EditSelector); });
    if (EditSelector.email) EditSelector.email.addEventListener('blur', function() { validateEmail(EditSelector); });
    if (EditSelector.submitButtonVisible) EditSelector.submitButtonVisible.addEventListener('click', function() { validateForm(EditSelector); });
    if (EditSelector.seePasswordCheckbox) EditSelector.seePasswordCheckbox.addEventListener('change', function() { seePassword(EditSelector); });
    if (EditSelector.password) EditSelector.password.addEventListener('blur', function() { validatePassword(EditSelector); });
    
    // Add form events
    if (AddSelector.cep) AddSelector.cep.addEventListener('blur', function() { searchAddress(AddSelector); });
    if (AddSelector.cpf) AddSelector.cpf.addEventListener('blur', function() { formatAndValidateCPF(AddSelector); });
    if (AddSelector.phone) AddSelector.phone.addEventListener('blur', function() { formatPhone(AddSelector); });
    if (AddSelector.name) AddSelector.name.addEventListener('blur', function() { validateName(AddSelector); });
    if (AddSelector.email) AddSelector.email.addEventListener('blur', function() { validateEmail(AddSelector); });
    if (AddSelector.submitButtonVisible) AddSelector.submitButtonVisible.addEventListener('click', function() { validateForm(AddSelector); });
    if (AddSelector.seePasswordCheckbox) AddSelector.seePasswordCheckbox.addEventListener('change', function() { seePassword(AddSelector); });
}

// Form validation and submission
function validateForm(selector) {
    const valid = validateAllFields(selector);
    
    if (valid) {
        // Get the formatted CPF value with dots and dashes
        let formattedCPF = selector.cpf.value;
        
        // Convert to numeric only format for database storage
        let numericCPF = formattedCPF.replace(/\D/g, "");
        
        // Store the CPF format for display in case of failed submission
        let displayCPF = formattedCPF;
        
        // Set the field to numeric-only format for submission
        selector.cpf.value = numericCPF;
        
        // Submit the form
        selector.submitButton.click();
        
        // Restore the formatted display value
        setTimeout(() => {
            selector.cpf.value = displayCPF;
        }, 100);
    }
}

// Validate all form fields
function validateAllFields(selector) {
    resetErrorMessages(selector);
    
    const emptyFieldsValid = validateEmptyFields(selector);
    const nameValid = validateName(selector);
    const emailValid = validateEmail(selector);
    const cpfValid = formatAndValidateCPF(selector);
    const cepValid = searchAddress(selector);
    const phoneValid = formatPhone(selector);
    
    // Password validation for both Add and Edit forms
    let passwordValid = true;
    if (selector === EditSelector && selector.password) {
        // Only validate password if not blank in Edit form
        if (selector.password.value.trim() !== "") {
            passwordValid = validatePassword(selector);
        } else {
            // Hide error if left blank
            selector.errorPassword.style.display = 'none';
            selector.password.classList.remove('error');
        }
    } else if (selector === AddSelector && selector.password) {
        // Always validate password in Add form
        passwordValid = validatePassword(selector);
    }
    
    return emptyFieldsValid && nameValid && emailValid && cpfValid && cepValid && phoneValid && passwordValid;
}

// Look up address using CEP
function searchAddress(selector) {
    let cep = selector.cep.value;
    let rawCep = cep.replace(/\D/g, "");

    if (rawCep.length === 8) {
        let formattedCep = rawCep.replace(/^(\d{2})(\d{3})(\d{3})$/, "$1.$2-$3");
        selector.cep.value = formattedCep;

        let url = `https://viacep.com.br/ws/${rawCep}/json/`;

        fetch(url)
            .then(response => response.json())
            .then(data => {
                if (!("erro" in data)) {
                    selector.address.value = data.logradouro;
                } else {
                    console.log("CEP não encontrado.");
                }
            })
            .catch(error => {
                console.error('Erro ao buscar o CEP:', error);
            });
        selector.errorCep.style.display = 'none';
        selector.cep.classList.remove('error');
        selector.cep.classList.remove('empty-field');
        return true;
    } else if (rawCep.length > 0) {
        selector.cep.classList.add('error');
        selector.errorCep.style.display = 'block';
        return false;
    }
    return true;
}

// Format and validate CPF
// This function formats the CPF for display with dots and dashes
// The actual database submission will use only the numeric characters
function formatAndValidateCPF(selector) {
    let cpf = selector.cpf.value;
    let formattedCpf = cpf.replace(/\D/g, "");

    if (formattedCpf.length <= 11) {
        // Format CPF as XXX.XXX.XXX-XX
        if (formattedCpf.length > 0) {
            formattedCpf = formattedCpf.replace(/^(\d{3})(\d{0,3})(\d{0,3})(\d{0,2})$/, function(matched, p1, p2, p3, p4) {
                let result = p1;
                if (p2) result += '.' + p2;
                if (p3) result += '.' + p3;
                if (p4) result += '-' + p4;
                return result;
            });
        }
    }

    selector.cpf.value = formattedCpf;

    let cleanCpf = cpf.replace(/\D/g, "");
    let isValid = true;

    if (cleanCpf.length > 0 && cleanCpf.length !== 11) {
        isValid = false;
    } else if (cleanCpf.length > 0 && /^(\d)\1+$/.test(cleanCpf)) {
        isValid = false;
    } else if (cleanCpf.length === 11) {
        // Calculate CPF validation
        let sum = 0;
        for (let i = 0; i < 9; i++) {
            sum += parseInt(cleanCpf.charAt(i)) * (10 - i);
        }
        let remainder = 11 - (sum % 11);
        if (remainder === 10 || remainder === 11) remainder = 0;
        
        if (remainder !== parseInt(cleanCpf.charAt(9))) {
            isValid = false;
        } else {
            sum = 0;
            for (let i = 0; i < 10; i++) {
                sum += parseInt(cleanCpf.charAt(i)) * (11 - i);
            }
            remainder = 11 - (sum % 11);
            if (remainder === 10 || remainder === 11) remainder = 0;
            
            if (remainder !== parseInt(cleanCpf.charAt(10))) {
                isValid = false;
            }
        }
    }

    if (!isValid && cleanCpf.length > 0) {
        selector.cpf.classList.add('error');
        selector.errorCpf.style.display = 'block';
        return false;
    } else {
        selector.cpf.classList.remove('error');
        selector.cpf.classList.remove('empty-field');
        selector.errorCpf.style.display = 'none';
        return true;
    }
}

// Format phone number
function formatPhone(selector) {
    let phone = selector.phone.value;
    let cleanPhone = phone.replace(/\D/g, "");

    selector.errorPhone.style.display = 'none';
    selector.phone.classList.remove('error');
    selector.phone.classList.remove('empty-field');

    if (cleanPhone.length === 11) {
        selector.phone.value = cleanPhone.replace(/^(\d{2})(\d{5})(\d{4})$/, "($1) $2-$3");
        return true;
    } else if (cleanPhone.length === 10) {
        selector.phone.value = cleanPhone.replace(/^(\d{2})(\d{4})(\d{4})$/, "($1) $2-$3");
        return true;
    } else if (cleanPhone.length === 9) {
        selector.phone.value = cleanPhone.replace(/^(\d{5})(\d{4})$/, "$1-$2");
        return true;
    } else if (cleanPhone.length === 8) {
        selector.phone.value = cleanPhone.replace(/^(\d{4})(\d{4})$/, "$1-$2");
        return true;
    } else if (cleanPhone.length > 0) {
        selector.phone.classList.add('error');
        selector.errorPhone.style.display = 'block';
        return false;
    }
    return true;
}

// Reset all error messages
function resetErrorMessages(selector) {
    selector.errorFields.style.display = 'none';
    
    // Clear all field-specific errors
    const errorElements = document.querySelectorAll('.error-message');
    errorElements.forEach(el => {
        el.style.display = 'none';
    });
    
    // Remove error class from all inputs
    const inputElements = selector.form.querySelectorAll('input, select');
    inputElements.forEach(el => {
        el.classList.remove('error');
        el.classList.remove('empty-field');
    });
}

// Validate required fields
function validateEmptyFields(selector) {
    const form = selector.form;
    const requiredFields = form.querySelectorAll(".required");
    let hasEmptyFields = false;

    requiredFields.forEach(field => {
        if (!field.value || field.value.trim() === "") {
            field.classList.add('empty-field');
            field.classList.add('error');
            hasEmptyFields = true;
        } else {
            field.classList.remove('empty-field');
        }
    });

    if (hasEmptyFields) {
        selector.errorFields.style.display = 'block';
        return false;
    }
    return true;
}

// Validate name format
function validateName(selector) {
    var name = selector.name.value.trim();
    const regexName = /^[A-Za-zÀ-ÖØ-öø-ÿ\s]+$/;
    if (name.length > 0 && (name.length < 2 || name.length > 100 || !regexName.test(name))) {
        selector.name.classList.add('error');
        selector.errorName.style.display = 'block';
        return false;
    } else {
        selector.name.classList.remove('error');
        selector.errorName.style.display = 'none';
        return true;
    }
}

// Validate email format
function validateEmail(selector) {
    const regexEmail = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (selector.email.value.length > 0 && !regexEmail.test(selector.email.value)) {
        selector.email.classList.add('error');
        selector.errorEmail.style.display = 'block';
        return false;
    } else {
        selector.email.classList.remove('error');
        selector.errorEmail.style.display = 'none';
        return true;
    }
}

// Validate password format and match
function validatePassword(selector) {
    const passwordRegex = /(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*\W).{8,}/;

    if (!passwordRegex.test(selector.password.value)) {
        selector.password.classList.add("error");
        selector.errorPassword.style.display = 'block';
        return false;
    } else {
        selector.password.classList.remove("error");
        selector.errorPassword.style.display = 'none';
    }
    
    // Only check password confirmation for the Add form
    if (selector === AddSelector && selector.passwordConfirm) {
        if (selector.password.value !== selector.passwordConfirm.value) {
            selector.password.classList.add("error");
            selector.passwordConfirm.classList.add("error");
            selector.errorEqualPasswords.style.display = 'block';
            return false;
        } else {
            selector.password.classList.remove("error");
            selector.passwordConfirm.classList.remove("error");
            selector.errorEqualPasswords.style.display = 'none';
        }
    }
    return true;
}

// Toggle password visibility
function seePassword(selector) {
    if (selector.seePasswordCheckbox.checked) {
        selector.password.type = "text";
        if (selector.passwordConfirm) {
            selector.passwordConfirm.type = "text";
        }
    } else {
        selector.password.type = "password";
        if (selector.passwordConfirm) {
            selector.passwordConfirm.type = "password";
        }
    }
}

// Original modal functions
function openEditModal(userId, name, username, email, cpf, cep, phone, address, role, complement) {
    // First, reset any existing form state and errors
    document.getElementById("editUserForm").reset();
    
    // Clear error states
    const errorMessages = document.querySelectorAll('#editModal .error-message');
    errorMessages.forEach(element => {
        element.style.display = 'none';
    });
    
    const inputFields = document.querySelectorAll('#editModal input, #editModal select');
    inputFields.forEach(element => {
        element.classList.remove('error');
        element.classList.remove('empty-field');
    });

    switch (role) {
        case "User":
            role = 1;
            break;
        case "Technician":
            role = 2;
            break;
        case "System Administrator":
            role = 3;
            break;
        default:
            break;
    }

    if (complement === null || complement === undefined || complement === "None" || complement === "none") {
        complement = "";
    }
    
    // Format CPF if needed
    const cleanCpf = cpf.replace(/\D/g, "");
    let formattedCpf = cpf;
    if (cleanCpf.length === 11) {
        formattedCpf = cleanCpf.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");
    }
    
    // Format CEP if needed
    const cleanCep = cep.replace(/\D/g, "");
    let formattedCep = cep;
    if (cleanCep.length === 8) {
        formattedCep = cleanCep.replace(/^(\d{2})(\d{3})(\d{3})$/, "$1.$2-$3");
    }
    
    // Format phone if needed
    const cleanPhone = phone.replace(/\D/g, "");
    let formattedPhone = phone;
    if (cleanPhone.length === 11) {
        formattedPhone = cleanPhone.replace(/^(\d{2})(\d{5})(\d{4})$/, "($1) $2-$3");
    } else if (cleanPhone.length === 10) {
        formattedPhone = cleanPhone.replace(/^(\d{2})(\d{4})(\d{4})$/, "($1) $2-$3");
    } else if (cleanPhone.length === 9) {
        formattedPhone = cleanPhone.replace(/^(\d{5})(\d{4})$/, "$1-$2");
    } else if (cleanPhone.length === 8) {
        formattedPhone = cleanPhone.replace(/^(\d{4})(\d{4})$/, "$1-$2");
    }
    
    // Set form values
    document.getElementById("editUserId").value = userId;
    document.getElementById("editName").value = name;
    document.getElementById("editUsername").value = username;
    document.getElementById("editEmail").value = email;
    document.getElementById("editCPF").value = formattedCpf;
    document.getElementById("editCEP").value = formattedCep;
    document.getElementById("editPhone").value = formattedPhone;
    document.getElementById("editAddress").value = address;
    document.getElementById("editRole").value = role;
    document.getElementById("editPassword").value = "";  // Clear password field
    if (document.getElementById("editObservation")) {
        document.getElementById("editObservation").value = complement || "";  // Set complement or empty string
    }
    
    // Reset password visibility
    if (document.getElementById("editPassword")) {
        document.getElementById("editPassword").type = "password";
    }
    if (document.getElementById("editSeePassword")) {
        document.getElementById("editSeePassword").checked = false;
    }
    
    document.getElementById("editModal").style.display = "block";
}

function closeEditModal() {
    document.getElementById("editModal").style.display = "none";
    document.getElementById("editUserForm").reset();
    
    // Reset any error messages and validation states
    const errorMessages = document.querySelectorAll('#editModal .error-message');
    errorMessages.forEach(element => {
        element.style.display = 'none';
    });
    
    const inputFields = document.querySelectorAll('#editModal input, #editModal select');
    inputFields.forEach(element => {
        element.classList.remove('error');
        element.classList.remove('empty-field');
    });
}

function openModalForm() {
    // First, reset any existing form state and errors
    document.getElementById('formUser').reset();
    
    // Clear error states
    const errorMessages = document.querySelectorAll('#modalOpenUser .error-message');
    errorMessages.forEach(element => {
        element.style.display = 'none';
    });
    
    const inputFields = document.querySelectorAll('#modalOpenUser input, #modalOpenUser select');
    inputFields.forEach(element => {
        element.classList.remove('error');
        element.classList.remove('empty-field');
    });
    
    // Reset password visibility
    if (document.getElementById('addPassword')) {
        document.getElementById('addPassword').type = 'password';
    }
    if (document.getElementById('addPasswordConfirm')) {
        document.getElementById('addPasswordConfirm').type = 'password';
    }
    if (document.getElementById('addSeePassword')) {
        document.getElementById('addSeePassword').checked = false;
    }
    
    const modal = document.getElementById('modalOpenUser');
    modal.classList.remove('hidden');
    modal.style.display = "block";
}

function closeModalForm() {
    const modal = document.getElementById('modalOpenUser');
    modal.classList.add('hidden');
    modal.style.display = "none";
    document.getElementById('formUser').reset();
    
    // Reset any error messages and validation states
    const errorMessages = document.querySelectorAll('#modalOpenUser .error-message');
    errorMessages.forEach(element => {
        element.style.display = 'none';
    });
    
    const inputFields = document.querySelectorAll('#modalOpenUser input, #modalOpenUser select');
    inputFields.forEach(element => {
        element.classList.remove('error');
        element.classList.remove('empty-field');
    });
    
    // Reset password visibility to password (hidden)
    if (document.getElementById('addPassword')) {
        document.getElementById('addPassword').type = 'password';
    }
    if (document.getElementById('addPasswordConfirm')) {
        document.getElementById('addPasswordConfirm').type = 'password';
    }
    if (document.getElementById('addSeePassword')) {
        document.getElementById('addSeePassword').checked = false;
    }
}

function openModal(userId) {
    const modal = document.getElementById("confirmationModal");
    const confirmButton = document.getElementById("confirmDeleteBtn");
    confirmButton.onclick = function () {
        window.location.href = `/users/delete/${userId}`;
    };
    modal.style.display = "block";
}

function closeModal() {
    document.getElementById("confirmationModal").style.display = "none";
}

// Success Modal Logic
function showSuccessModal(message) {
    const modal = document.getElementById('successModal');
    const messageText = document.getElementById('successMessageText');
    const closeBtn = document.getElementById('closeSuccessBtn');
    if (messageText) messageText.textContent = message;
    if (modal) modal.style.display = 'block';
    if (closeBtn) {
        closeBtn.onclick = function() {
            modal.style.display = 'none';
        };
    }
    // Also close modal if user clicks outside
    window.onclick = function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    };
}

// Fecha modais ao clicar fora
window.onclick = function (event) {
    const confirmationModal = document.getElementById("confirmationModal");
    const editModal = document.getElementById("editModal");
    const modalOpenUser = document.getElementById("modalOpenUser");
    const successModal = document.getElementById("successModal");

    if (event.target === confirmationModal) confirmationModal.style.display = "none";
    if (event.target === editModal) closeEditModal();
    if (event.target === modalOpenUser) closeModalForm();
    if (event.target === successModal) successModal.style.display = "none";
};

// Format CPF, CEP, and phone numbers in the users table
function formatTableData() {
    // Format CPF cells
    const cpfCells = document.querySelectorAll('td[data-label="CPF"]');
    cpfCells.forEach(cell => {
        const cpf = cell.textContent.trim();
        if (cpf && cpf.length > 0) {
            // Remove any existing formatting
            const cleanCpf = cpf.replace(/\D/g, "");
            // Format as XXX.XXX.XXX-XX if it has 11 digits
            if (cleanCpf.length === 11) {
                cell.textContent = cleanCpf.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");
            }
        }
    });

    // Format CEP cells
    const cepCells = document.querySelectorAll('td[data-label="CEP"]');
    cepCells.forEach(cell => {
        const cep = cell.textContent.trim();
        if (cep && cep.length > 0) {
            // Remove any existing formatting
            const cleanCep = cep.replace(/\D/g, "");
            // Format as XX.XXX-XXX if it has 8 digits
            if (cleanCep.length === 8) {
                cell.textContent = cleanCep.replace(/^(\d{2})(\d{3})(\d{3})$/, "$1.$2-$3");
            }
        }
    });

    // Format phone number cells
    const phoneCells = document.querySelectorAll('td[data-label="Telefone"]');
    phoneCells.forEach(cell => {
        const phone = cell.textContent.trim();
        if (phone && phone.length > 0) {
            // Remove any existing formatting
            const cleanPhone = phone.replace(/\D/g, "");
            // Format based on length
            if (cleanPhone.length === 11) {
                // Format as (XX) XXXXX-XXXX (with 9-digit number)
                cell.textContent = cleanPhone.replace(/^(\d{2})(\d{5})(\d{4})$/, "($1) $2-$3");
            } else if (cleanPhone.length === 10) {
                // Format as (XX) XXXX-XXXX (with 8-digit number)
                cell.textContent = cleanPhone.replace(/^(\d{2})(\d{4})(\d{4})$/, "($1) $2-$3");
            } else if (cleanPhone.length === 9) {
                // Format as XXXXX-XXXX (without area code)
                cell.textContent = cleanPhone.replace(/^(\d{5})(\d{4})$/, "$1-$2");
            } else if (cleanPhone.length === 8) {
                // Format as XXXX-XXXX (without area code)
                cell.textContent = cleanPhone.replace(/^(\d{4})(\d{4})$/, "$1-$2");
            }
        }
    });
}
