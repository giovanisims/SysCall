document.addEventListener('DOMContentLoaded', function () {
    // Load selectors and events here
    var name = document.getElementById('NameSurname');
    var username = document.getElementById('Username');
    var email = document.getElementById('Email');
    var cpf = document.getElementById('CPF');
    var phone = document.getElementById('Number');
    var cep = document.getElementById('CEP');
    var address = document.getElementById('Address');
    var complement = document.getElementById('Complement');
    var password = document.getElementById('Password');
    var passwordConfirm = document.getElementById('passwordConfirm');
    var submitButtonVisible = document.getElementById('submitButtonVisible');
    var errorCep = document.getElementById('errorCep');
    var errorFields = document.getElementById('errorFields');
    var errorPassword = document.getElementById('errorPassword');
    var errorEqualPasswords = document.getElementById('errorEqualPasswords');
    var errorCpf = document.getElementById('errorCpf');
    var errorPhone = document.getElementById('errorPhone');

    cep.addEventListener('blur', searchAddress);
    cpf.addEventListener('blur', formatAndValidateCPF);
    phone.addEventListener('blur', formatPhone);
    submitButtonVisible.addEventListener('click', validateAndSubmitForm); // Changed to a new function
    document.getElementById('seePassword').addEventListener('change', seePassword);
});

function validateAndSubmitForm(event) {
    event.preventDefault(); // Prevent the default form submission

    resetErrorMessages();
    var emptyFieldsValid = validateEmptyFields();
    var passwordValid = validatePassword();

    var valid = emptyFieldsValid && passwordValid;

    if (valid) {
        submitForm(); // Call the submitForm function
    }
}

function submitForm() {
    // Collect form data
    const formData = {
        Username: username.value,
        Email: email.value,
        NameSurname: name.value,
        CPF: cpf.value,
        Number: phone.value,
        CEP: cep.value,
        Address: address.value,
        Complement: complement.value,
        Password: password.value
    };

    // Send POST request using fetch
    fetch('/sign_up', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
    })
    .then(response => {
        if (response.redirected) {
            window.location.href = response.url;
        } else {
            console.log('Sign-up failed');
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

function searchAddress() {
    let cepElement = document.getElementById("CEP");
    let cepValue = cepElement.value;

    let rawCep = cepValue.replace(/\D/g, "");

    if (rawCep.length === 8) {
        let formattedCep = rawCep.replace(/^(\d{2})(\d{3})(\d{3})$/, "$1.$2-$3");
        document.getElementById("CEP").value = formattedCep;

        let url = `https://viacep.com.br/ws/${rawCep}/json/`;

        fetch(url)
            .then(response => response.json())
            .then(data => {
                if (!("erro" in data)) {
                    document.getElementById("Address").value = data.logradouro;
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
    let cpfElement = document.getElementById("CPF");
    let cpfValue = cpfElement.value;
    let formattedCpf = cpfValue.replace(/\D/g, "");

    if (formattedCpf.length <= 11) {
        formattedCpf = cpfValue.replace(/^(\d{3})(\d{3})(\d{3})(\d{0,2})$/, "$1.$2.$3-$4");
    }

    cpfElement.value = formattedCpf;

    let cleanCpf = cpfValue.replace(/\D/g, "");
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
    let phoneElement = document.getElementById("Number");
    let phoneValue = phoneElement.value;

    let cleanPhone = phoneValue.replace(/\D/g, "");
    errorPhone.style.display = 'none';
    phoneElement.classList.remove('error');
    phoneElement.classList.remove('empty-field');
    
    if (cleanPhone.length === 11) {
        phoneElement.value = cleanPhone.replace(/^(\d{2})(\d{5})(\d{4})$/, "($1) $2-$3");
    } else if (cleanPhone.length === 10) {
        phoneElement.value = cleanPhone.replace(/^(\d{2})(\d{4})(\d{4})$/, "($1) $2-$3");
    } else if (cleanPhone.length > 0) {
        errorPhone.style.display = 'block';
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
    if (!passwordRegex.test(password.value)) {
        console.log("senha não atende requisitos");
        password.classList.add("error");
        errorPassword.style.display = 'block';
        return false;
    } else {
        password.classList.remove("error");
    }
    if (password.value !== passwordConfirm.value) {
        password.classList.add("error");
        passwordConfirm.classList.add("error");
        errorEqualPasswords.style.display = 'block';
        return false;
    } else {
        password.classList.remove("error");
        passwordConfirm.classList.remove("error");
    }
    return true;
}

function seePassword(event) {
    const checkbox = document.getElementById('seePassword');

    if (checkbox.checked) {
        password.type = "text";
        passwordConfirm.type = "text";
    } else {
        password.type = "password";
        passwordConfirm.type = "password";
    }
}