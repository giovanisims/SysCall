document.addEventListener('DOMContentLoaded', function() {
    loadSelectors();
    loadEvents();
});


function loadSelectors(){
    var name = document.getElementById('name');
    var surname = document.getElementById('surname');
    var email = document.getElementById('email');
    var cpf = document.getElementById('cpf');
    var phone = document.getElementById('phone');
    var cep = document.getElementById('cep');
    var address = document.getElementById('address');
    var password = document.getElementById('password');
    var passwordConfirm = document.getElementById('passwordConfirm');
    var submitButtonVisible = document.getElementById('submitButtonVisible')
    var submitButton = document.getElementById('submitButton');
    var errorCep = document.getElementById('errorCep');
    var errorFields = document.getElementById('errorFields');
    var errorPassword = document.getElementById('errorPassword')
    var errorEqualPasswords = document.getElementById('errorEqualPasswords')
}

function loadEvents(){
    cep.addEventListener('blur', searchAddress);
    cpf.addEventListener('blur', formatAndValidateCPF);
    submitButtonVisible.addEventListener('click', validateForm)
    document.getElementById('seePassword').addEventListener('change', seePassword);
}

function validateForm(){
    resetErrorMessages()
    var emptyFieldsValid = validateEmptyFields()
    var passwordValid = validatePassword()
    
    var valid = emptyFieldsValid && passwordValid
    
    if(valid){
        document.getElementById('submitButton').click()
    }
}

function searchAddress() {
    let cep = document.getElementById("cep").value;
    
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
    } else {
        errorCep.style.display = 'block';
    }
}

function formatAndValidateCPF() {
    let cpf = document.getElementById("cpf").value;
    cpf = cpf.replace(/\D/g, ""); 

    if (cpf.length <= 11) {
        cpf = cpf.replace(/^(\d{3})(\d{3})(\d{3})(\d{0,2})$/, "$1.$2.$3-$4");
    }

    cpf.value = cpf; 

    if (cpf.length === 14) { 
        if (!validateCPF(cpf)) {
            cpf.classList.add('error')
        } else {
            cpf.classList.remove('error')
        }
    }
}

function validateCPF(cpf) {
    cpf = cpf.replace(/\D/g, ""); // Remove caracteres não numéricos

    if (cpf.length !== 11) return false; // CPF deve ter 11 dígitos

    // Rejeita CPFs inválidos conhecidos (ex: 111.111.111-11)
    if (/^(\d)\1+$/.test(cpf)) return false;

    // Cálculo dos dígitos verificadores
    let sum = 0, remainder;

    for (let i = 1; i <= 9; i++) sum += parseInt(cpf[i - 1]) * (11 - i);
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf[9])) return false;

    sum = 0;
    for (let i = 1; i <= 10; i++) sum += parseInt(cpf[i - 1]) * (12 - i);
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf[10])) return false;

    return true;
}

function resetErrorMessages(){
    errorCep.style.display = 'none';
    errorFields.style.display = 'none';
    errorPassword.style.display = 'none';
    errorEqualPasswords.style.display = 'none';
}
    
function validateEmptyFields(){
    var requiredFields = document.getElementsByClassName("required");
    var requiredFieldsArray = Array.from(requiredFields);
    var hasEmptyFields = false;

    if (requiredFieldsArray.length > 0) {
        requiredFieldsArray.forEach(field => {
            if(!field.value || field.value.trim() === ""){
                console.log("campo obrigatório");
                field.classList.add("empty-field");
                hasEmptyFields = true;
            } else{
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

function validatePassword(){
    const passwordRegex = /(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*\W).{4,}/;
    if(!passwordRegex.test(password.value)){
        console.log("senha não atende requisitos");
        password.classList.add("error");
        errorPassword.style.display = 'block';
        return false;
    }else{
        password.classList.remove("error");
    }
    if(password.value !== passwordConfirm.value){
        password.classList.add("error");
        passwordConfirm.classList.add("error");
        errorEqualPasswords.style.display = 'block';
        return false;
    }else{
        password.classList.remove("error");
        passwordConfirm.classList.remove("error");
    }
    return true;
}

function seePassword(event){
    const checkbox = document.getElementById('seePassword');
   
    if(checkbox.checked){
        password.type = "text";
        passwordConfirm.type = "text";
    } else {
        password.type = "password";
        passwordConfirm.type = "password";
    }
}

