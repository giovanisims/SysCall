var Selector

document.addEventListener('DOMContentLoaded', function () {
    Selector = loadSelectors();
    loadEvents();
});

function loadSelectors() {
    return {
        name: document.getElementById('name'),
        surname: document.getElementById('surname'),
        email: document.getElementById('email'),
        cpf: document.getElementById('cpf'),
        phone: document.getElementById('phone'),
        cep: document.getElementById('cep'),
        address: document.getElementById('address'),
        password: document.getElementById('password'),
        passwordConfirm: document.getElementById('passwordConfirm'),
        submitButtonVisible: document.getElementById('submitButtonVisible'),
        submitButton: document.getElementById('submitButton'),
        errorCep: document.getElementById('errorCep'),
        errorFields: document.getElementById('errorFields'),
        errorPassword: document.getElementById('errorPassword'),
        errorEqualPasswords: document.getElementById('errorEqualPasswords'),
        errorCpf: document.getElementById('errorCpf'),
        errorPhone: document.getElementById('errorPhone'),
        seePasswordCheckbox: document.getElementById('seePassword'),
        errorName: document.getElementById('errorName'),
        errorSurname: document.getElementById('errorSurname'),
        errorEmail: document.getElementById('errorEmail'),
    };
}

function loadEvents() {
    Selector.cep.addEventListener('blur', searchAddress);
    Selector.cpf.addEventListener('blur', formatAndValidateCPF);
    Selector.phone.addEventListener('blur', formatPhone);
    Selector.name.addEventListener('blur', validateName);
    Selector.surname.addEventListener('blur', validateSurname);
    Selector.email.addEventListener('blur', validateEmail);
    Selector.submitButtonVisible.addEventListener('click', validateForm);
    Selector.seePasswordCheckbox.addEventListener('change', seePassword);
}

function validateForm() {
    const valid = validateAllFields();
    
    if (valid) {
        Selector.submitButton.click();
    }
}

function validateAllFields() {
    resetErrorMessages();
    
    const emptyFieldsValid = validateEmptyFields();
    const nameValid = validateName();
    const surnameValid = validateSurname();
    const emailValid = validateEmail();
    const cpfValid = formatAndValidateCPF();
    const cepValid = searchAddress();
    const phoneValid = formatPhone();
    const passwordValid = validatePassword();
    
    return emptyFieldsValid && nameValid && emailValid && cpfValid && 
           cepValid && phoneValid && passwordValid &&surnameValid;
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
                } else {
                    alert("CEP não encontrado.");
                }
            })
            .catch(error => {
                console.error('Erro ao buscar o CEP:', error);
                alert("Erro ao buscar o CEP.");
            });
        Selector.errorCep.style.display = 'none';
        Selector.cep.classList.remove('error');
        Selector.cep.classList.remove('empty-field');
        return true;
    } else {
        Selector.cep.classList.add('error');
        Selector.errorCep.style.display = 'block';
        return false;
    }
}

function formatAndValidateCPF() {
    let cpf = Selector.cpf.value;
    let formattedCpf = cpf.replace(/\D/g, "");

    if (formattedCpf.length <= 11) {
        formattedCpf = cpf.replace(/^(\d{3})(\d{3})(\d{3})(\d{0,2})$/, "$1.$2.$3-$4");
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

function resetErrorMessages() {
    Selector.errorFields.style.display = 'none';
    Selector.errorPassword.style.display = 'none';
    Selector.errorEqualPasswords.style.display = 'none';
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
            Selector.errorFields.style.display = 'block';
            return false;
        }
    }
    return true;
}

function validatePassword() {
    const passwordRegex = /(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*\W).{8,}/;

    if (!passwordRegex.test(Selector.password.value)) {
        console.log("senha não atende requisitos");
        Selector.password.classList.add("error");
        Selector.errorPassword.style.display = 'block';
        return false;
    } else {
        Selector.password.classList.remove("error");
    }
    if (Selector.password.value !== Selector.passwordConfirm.value) {
        Selector.password.classList.add("error");
        Selector.passwordConfirm.classList.add("error");
        Selector.errorEqualPasswords.style.display = 'block';
        return false;
    } else {
        Selector.password.classList.remove("error");
        Selector.passwordConfirm.classList.remove("error");
    }
    return true;
}

function seePassword(event) {
    if (Selector.seePasswordCheckbox.checked) {
        Selector.password.type = "text";
        Selector.passwordConfirm.type = "text";
    } else {
        Selector.password.type = "password";
        Selector.passwordConfirm.type = "password";
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
        Selector.errorName.style.display = 'none';
        return true;
    }
}

function validateSurname() {
    var surname = Selector.surname.value.trim();
    const regexName = /^[A-Za-zÀ-ÖØ-öø-ÿ\s]+$/;
    if (!surname || surname.length < 2 || surname.length > 100 || !regexName.test(surname)) {
        Selector.surname.classList.add('error');
        Selector.errorSurname.style.display = 'block';
        return false;
    } else {
        Selector.surname.classList.remove('error');
        Selector.errorSurname.style.display = 'none';
        return true;
    }
}

function validateEmail() {
    const regexEmail = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!regexEmail.test(Selector.email.value)) {
        Selector.email.classList.add('error');
        Selector.errorEmail.style.display = 'block';
        return false;
    } else {
        Selector.email.classList.remove('error');
        Selector.errorEmail.style.display = 'none';
        return true;
    }
}