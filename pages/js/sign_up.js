document.addEventListener('DOMContentLoaded', function () {
    loadSelectors();
    loadEvents();
});

function loadSelectors() {
    var name = document.getElementById('name');
    var surname = document.getElementById('surname');
    var email = document.getElementById('email');
    var cpf = document.getElementById('cpf');
    var phone = document.getElementById('phone');
    var cep = document.getElementById('cep');
    var address = document.getElementById('address');
    var password = document.getElementById('password');
    var passwordConfirm = document.getElementById('passwordConfirm');
    var submitButtonVisible = document.getElementById('submitButtonVisible');
    var errorCep = document.getElementById('errorCep');
    var errorFields = document.getElementById('errorFields');
    var errorPassword = document.getElementById('errorPassword');
    var errorEqualPasswords = document.getElementById('errorEqualPasswords');
    var errorCpf = document.getElementById('errorCpf');
    var errorPhone = document.getElementById('errorPhone');
}


function loadEvents() {
    cep.addEventListener('blur', searchAddress);
    cpf.addEventListener('blur', formatAndValidateCPF);
    phone.addEventListener('blur', formatPhone)
    submitButtonVisible.addEventListener('click', validateForm)
    document.getElementById('seePassword').addEventListener('change', seePassword);
}

function validateForm() {
    resetErrorMessages()
    var emptyFieldsValid = validateEmptyFields()
    var passwordValid = validatePassword()

    var valid = emptyFieldsValid && passwordValid

    if (valid) {
        document.getElementById('submitButton').click()
    }
}

function searchAddress() {
    let cepElement = document.getElementById("cep");
    let cep = cepElement.value;

    let rawCep = cep.replace(/\D/g, "");

    if (rawCep.length === 8) {
        let formattedCep = rawCep.replace(/^(\d{2})(\d{3})(\d{3})$/, "$1.$2-$3");
        document.getElementById("cep").value = formattedCep;

        let url = `https://viacep.com.br/ws/${rawCep}/json/`;

        fetch(url)
            .then(response => response.json())
            .then(data => {
                if (!("erro" in data)) {
                    document.getElementById("address").value = data.logradouro;
                } else {
                    alert("CEP não encontrado.");
                }
            })
            .catch(error => {
                console.error('Erro ao buscar o CEP:', error);
                alert("Erro ao buscar o CEP.");
            });
        errorCep.style.display = 'none';
        cepElement.classList.remove('error');
        cepElement.classList.remove('empty-field');
    } else {
        cepElement.classList.add('error');
        errorCep.style.display = 'block';
    }
}

function formatAndValidateCPF() {
    let cpfElement = document.getElementById("cpf");
    let cpf = cpfElement.value;
    let formattedCpf = cpf.replace(/\D/g, "");

    if (formattedCpf.length <= 11) {
        formattedCpf = cpf.replace(/^(\d{3})(\d{3})(\d{3})(\d{0,2})$/, "$1.$2.$3-$4");
    }

    cpfElement.value = formattedCpf;

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
        cpfElement.classList.add('error');
        errorCpf.style.display = 'block';
    } else {
        cpfElement.classList.remove('error');
        cpfElement.classList.remove('empty-field');
        errorCpf.style.display = 'none';
    }
}

function formatPhone() {
    let phoneElement = document.getElementById("phone");
    let phone = phoneElement.value;

    let cleanPhone = phone.replace(/\D/g, "");
    errorPhone.style.display = 'none'
    phoneElement.classList.remove('error');
    phoneElement.classList.remove('empty-field')
    if (cleanPhone.length === 11) {
        phoneElement.value = cleanPhone.replace(/^(\d{2})(\d{5})(\d{4})$/, "($1) $2-$3");
        phoneElement.classList.remove('error');
        phoneElement.classList.remove('empty-field');
    } else if (cleanPhone.length === 10) {
        phoneElement.value = cleanPhone.replace(/^(\d{2})(\d{4})(\d{4})$/, "($1) $2-$3");
        phoneElement.classList.remove('error');
        phoneElement.classList.remove('empty-field');
    } else if (cleanPhone.length > 0) {
        errorPhone.style.display = 'block'
        phoneElement.classList.add('error');
    }
}


function resetErrorMessages() {
    errorFields.style.display = 'none';
    errorPassword.style.display = 'none';
    errorEqualPasswords.style.display = 'none';
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
            errorFields.style.display = 'block';
            return false;
        }
    }
    return true;
}

function validatePassword() {
    const passwordRegex = /(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*\W).{4,}/;
    // Get elements directly here as well for consistency
    const passwordInput = document.getElementById('password');
    const passwordConfirmInput = document.getElementById('passwordConfirm');

    if (!passwordRegex.test(passwordInput.value)) {
        console.log("senha não atende requisitos");
        passwordInput.classList.add("error");
        errorPassword.style.display = 'block';
        return false;
    } else {
        passwordInput.classList.remove("error");
    }
    if (passwordInput.value !== passwordConfirmInput.value) {
        passwordInput.classList.add("error");
        passwordConfirmInput.classList.add("error");
        errorEqualPasswords.style.display = 'block';
        return false;
    } else {
        passwordInput.classList.remove("error");
        passwordConfirmInput.classList.remove("error");
    }
    return true;
}

function seePassword(event) {
    const checkbox = document.getElementById('seePassword');
    // Get the password input elements directly inside the function
    const passwordInput = document.getElementById('password');
    const passwordConfirmInput = document.getElementById('passwordConfirm');

    if (checkbox.checked) {
        passwordInput.type = "text";
        passwordConfirmInput.type = "text";
    } else {
        passwordInput.type = "password";
        passwordConfirmInput.type = "password";
    }
}