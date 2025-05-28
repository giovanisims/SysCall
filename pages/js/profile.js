var Selector;

document.addEventListener('DOMContentLoaded', async () => {
    Selector = loadSelectors();
    loadEvents();
    
    try {
        const response = await fetch('/profile/data');
        if (!response.ok) throw new Error('Erro ao carregar os dados do perfil');
        const user = await response.json();

        // Populate form fields with user data
        Selector.username.value = user.Username || '';
        Selector.name.value = user.NameSurname || '';
        Selector.email.value = user.Email || '';
        Selector.cpf.value = user.CPF || '';
        Selector.phone.value = user.Number || '';
        Selector.cep.value = user.CEP || '';
        Selector.address.value = user.Address || '';
        Selector.observation.value = user.Complement || '';

        // Ensure errors are hidden on page load
        resetErrorMessages();
    } catch (error) {
        console.error(error);
        alert('Erro ao carregar os dados do perfil.');
    }
});

function loadSelectors() {
    return {
        username: document.getElementById('username'),
        name: document.getElementById('namesurname'),
        email: document.getElementById('email'),
        cpf: document.getElementById('cpf'),
        phone: document.getElementById('phone'),
        cep: document.getElementById('cep'),
        address: document.getElementById('address'),
        observation: document.getElementById('observation'),
        submitButtonVisible: document.getElementById('submitButtonVisible'),
        submitButton: document.getElementById('submitButton'),
        errorUsername: document.getElementById('errorUsername'),
        errorName: document.getElementById('errorName'),
        errorEmail: document.getElementById('errorEmail'),
        errorCpf: document.getElementById('errorCpf'),
        errorPhone: document.getElementById('errorPhone'),
        errorCep: document.getElementById('errorCep'),
        errorFields: document.getElementById('errorFields')
    };
}

function loadEvents() {
    // Add event listeners for form validation
    Selector.username.addEventListener('blur', validateUsername);
    Selector.name.addEventListener('blur', validateName);
    Selector.email.addEventListener('blur', validateEmail);
    Selector.cpf.addEventListener('blur', formatAndValidateCPF);
    Selector.phone.addEventListener('blur', formatPhone);
    Selector.cep.addEventListener('blur', searchAddress);
    Selector.submitButtonVisible.addEventListener('click', validateForm);
    
    // Add form submit event to prevent submission with errors
    const form = Selector.submitButton.form;
    if (form) {
        form.addEventListener('submit', function(event) {
            const valid = validateAllFields();
            if (!valid) {
                event.preventDefault();
                showValidationErrors();
            } else {
                cleanAllInputs();
            }
        });
    }
}

function validateForm() {
    // Reset error messages
    resetErrorMessages();
    
    // Validate all fields
    const valid = validateAllFields();
    
    if (valid) {
        // Clean all inputs before submitting
        cleanAllInputs();
        
        // Submit the form
        Selector.submitButton.click();
    } else {
        // Show error message
        showValidationErrors();
        return false;
    }
}

// Function to clean all inputs before submitting
function cleanAllInputs() {
    // Clean username - remove extra spaces
    Selector.username.value = Selector.username.value.trim();
    
    // Clean name - remove extra spaces
    Selector.name.value = Selector.name.value.trim();
    
    // Clean email - remove extra spaces
    Selector.email.value = Selector.email.value.trim();
    
    // CPF is already formatted by formatAndValidateCPF
    // Phone is already formatted by formatPhone
    // CEP is already formatted by searchAddress
    
    // Clean address - remove extra spaces
    Selector.address.value = Selector.address.value.trim();
    
    // Clean observation - remove extra spaces
    if (Selector.observation.value) {
        Selector.observation.value = Selector.observation.value.trim();
    }
}

// Function to show validation errors
function showValidationErrors() {
    // If there are validation errors, scroll to the first error message
    const errorElements = document.querySelectorAll('.error-message[style*="display: block"]');
    if (errorElements.length > 0) {
        errorElements[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

function validateAllFields() {
    resetErrorMessages();
    
    const emptyFieldsValid = validateEmptyFields();
    const usernameValid = validateUsername();
    const nameValid = validateName();
    const emailValid = validateEmail();
    const cpfValid = formatAndValidateCPF();
    const phoneValid = formatPhone();
    const cepValid = searchAddress();
    
    return emptyFieldsValid && usernameValid && nameValid && emailValid && 
           cpfValid && phoneValid && cepValid;
}

function resetErrorMessages() {
    // Hide all error messages
    Selector.errorUsername.style.display = 'none';
    Selector.errorName.style.display = 'none';
    Selector.errorEmail.style.display = 'none';
    Selector.errorCpf.style.display = 'none';
    Selector.errorPhone.style.display = 'none';
    Selector.errorCep.style.display = 'none';
    Selector.errorFields.style.display = 'none';
}

function validateEmptyFields() {
    var requiredFields = document.getElementsByClassName("required");
    var requiredFieldsArray = Array.from(requiredFields);
    var hasEmptyFields = false;

    if (requiredFieldsArray.length > 0) {
        requiredFieldsArray.forEach(field => {
            // Trim the value to check for whitespace-only values
            if (!field.value || field.value.trim() === "") {
                field.classList.add("empty-field");
                hasEmptyFields = true;
            } else {
                field.classList.remove("empty-field");
            }
        });

        if (hasEmptyFields) {
            Selector.errorFields.style.display = 'block';
            return false;
        }
    }
    return true;
}

function validateUsername() {
    const username = Selector.username.value.trim();
    
    if (!username || username.length < 3 || username.length > 30) {
        Selector.username.classList.add('error');
        Selector.errorUsername.style.display = 'block';
        return false;
    } else {
        Selector.username.classList.remove('error');
        Selector.username.classList.remove('empty-field');
        Selector.errorUsername.style.display = 'none';
        return true;
    }
}

function validateName() {
    var name = Selector.name.value.trim();
    const regexName = /^[A-Za-zÀ-ÖØ-öø-ÿ\s]+$/;
    
    if (!name || name.length < 2 || name.length > 100 || !regexName.test(name)) {
        Selector.name.classList.add('error');
        Selector.errorName.style.display = 'block';
        return false;
    } else {
        Selector.name.classList.remove('error');
        Selector.name.classList.remove('empty-field');
        Selector.errorName.style.display = 'none';
        return true;
    }
}

function validateEmail() {
    const regexEmail = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const email = Selector.email.value.trim();
    
    if (!email || !regexEmail.test(email)) {
        Selector.email.classList.add('error');
        Selector.errorEmail.style.display = 'block';
        return false;
    } else {
        Selector.email.classList.remove('error');
        Selector.email.classList.remove('empty-field');
        Selector.errorEmail.style.display = 'none';
        return true;
    }
}

function formatAndValidateCPF() {
    let cpf = Selector.cpf.value;
    let formattedCpf = cpf.replace(/\D/g, "");

    if (formattedCpf.length <= 11) {
        formattedCpf = formattedCpf.replace(/^(\d{3})(\d{3})(\d{3})(\d{0,2})$/, "$1.$2.$3-$4");
    }

    Selector.cpf.value = formattedCpf;

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
        Selector.cpf.classList.add('error');
        Selector.errorCpf.style.display = 'block';
        return false;
    } else {
        Selector.cpf.classList.remove('error');
        Selector.cpf.classList.remove('empty-field');
        Selector.errorCpf.style.display = 'none';
        return true;
    }
}

function formatPhone() {
    let phone = Selector.phone.value;
    let cleanPhone = phone.replace(/\D/g, "");

    Selector.errorPhone.style.display = 'none';
    Selector.phone.classList.remove('error');
    Selector.phone.classList.remove('empty-field');

    if (cleanPhone.length === 11) {
        Selector.phone.value = cleanPhone.replace(/^(\d{2})(\d{5})(\d{4})$/, "($1) $2-$3");
    } else if (cleanPhone.length === 10) {
        Selector.phone.value = cleanPhone.replace(/^(\d{2})(\d{4})(\d{4})$/, "($1) $2-$3");
    } else if (cleanPhone.length === 9) {
        Selector.phone.value = cleanPhone.replace(/^(\d{5})(\d{4})$/, "$1-$2");
    } else if (cleanPhone.length > 0) {
        Selector.errorPhone.style.display = 'block';
        Selector.phone.classList.add('error');
        return false;
    }
    return true;
}

function searchAddress() {
    let cep = Selector.cep.value;
    let rawCep = cep.replace(/\D/g, "");

    if (rawCep.length === 8) {
        let formattedCep = rawCep.replace(/^(\d{2})(\d{3})(\d{3})$/, "$1.$2-$3");
        Selector.cep.value = formattedCep;

        let url = `https://viacep.com.br/ws/${rawCep}/json/`;

        fetch(url)
            .then(response => response.json())
            .then(data => {
                if (!("erro" in data)) {
                    Selector.address.value = data.logradouro;
                    Selector.errorCep.style.display = 'none';
                    Selector.cep.classList.remove('error');
                    Selector.cep.classList.remove('empty-field');
                } else {
                    Selector.errorCep.textContent = "CEP não encontrado.";
                    Selector.errorCep.style.display = 'block';
                    Selector.cep.classList.add('error');
                }
            })
            .catch(error => {
                console.error('Erro ao buscar o CEP:', error);
                Selector.errorCep.textContent = "Erro ao buscar o CEP.";
                Selector.errorCep.style.display = 'block';
                Selector.cep.classList.add('error');
            });
        return true;
    } else {
        Selector.errorCep.textContent = "CEP inválido";
        Selector.cep.classList.add('error');
        Selector.errorCep.style.display = 'block';
        return false;
    }
}

// Handle profile image update
const fileInput = document.getElementById("file");
const profileImage = document.querySelector(".profile-photo img");

if (fileInput && profileImage) {
    fileInput.addEventListener("change", (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();

            reader.onload = (e) => {
                profileImage.src = e.target.result;
            };

            reader.readAsDataURL(file);
        }
    });
}