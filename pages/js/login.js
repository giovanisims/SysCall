document.addEventListener('DOMContentLoaded', function() {
    loadSelectors();
    loadEvents();
});

// Form selector object to store all form elements
var FormSelector = {};

function loadSelectors(){
    FormSelector = {
        // Form elements
        email: document.getElementById('email'),
        password: document.getElementById('password'),
        // Buttons
        submitButtonVisible: document.getElementById('submitButtonVisible'),
        submitButton: document.getElementById('submitButton'),
        // Error messages
        errorFields: document.getElementById('errorFields'),
        errorEmail: document.getElementById('errorEmail')
    };
}

function loadEvents(){
    if (FormSelector.submitButtonVisible) {
        FormSelector.submitButtonVisible.addEventListener('click', validateForm);
    }
    
    if (FormSelector.email) {
        FormSelector.email.addEventListener('blur', validateEmail);
    }
    
    if (FormSelector.password) {
        FormSelector.password.addEventListener('blur', function() {
            validateEmptyField(FormSelector.password);
        });
    }
}

function validateForm(){
    resetErrorMessages();
    
    var emptyFieldsValid = validateEmptyFields();
    var emailValid = validateEmail();
    
    if(emptyFieldsValid && emailValid){
        if (FormSelector.submitButton) {
            FormSelector.submitButton.click();
        } else {
            // Fallback if button not found
            document.querySelector('form').submit();
        }
    }
}

function resetErrorMessages(){
    if (FormSelector.errorFields) {
        FormSelector.errorFields.style.display = 'none';
    }
    
    if (FormSelector.errorEmail) {
        FormSelector.errorEmail.style.display = 'none';
    }
    
    // Remove error class from all inputs
    var inputElements = document.querySelectorAll('input.required');
    inputElements.forEach(el => {
        el.classList.remove('error');
        el.classList.remove('empty-field');
    });
}

function validateEmptyFields(){
    var requiredFields = document.getElementsByClassName("required");
    var requiredFieldsArray = Array.from(requiredFields);
    var hasEmptyFields = false;

    if (requiredFieldsArray.length > 0) {
        requiredFieldsArray.forEach(field => {
            if(!field.value || field.value.trim() === ""){
                field.classList.add("empty-field");
                field.classList.add("error");
                hasEmptyFields = true;
            } else{
                field.classList.remove("empty-field");
                field.classList.remove("error");
            }
        });
        
        if (hasEmptyFields) {
            FormSelector.errorFields.style.display = 'block';
            return false;
        }
    }
    return true;
}

// Helper function to validate a single empty field
function validateEmptyField(field) {
    if(!field || !field.value || field.value.trim() === "") {
        field.classList.add("empty-field");
        field.classList.add("error");
        return false;
    } else {
        field.classList.remove("empty-field");
        field.classList.remove("error");
        return true;
    }
}

// Validate email format
function validateEmail() {
    if (!FormSelector.email) return true;
    
    // First check if it's empty (this will be handled by validateEmptyFields)
    if (!FormSelector.email.value || FormSelector.email.value.trim() === "") {
        return false;
    }
    
    // Email regex pattern
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    
    if (!emailRegex.test(FormSelector.email.value)) {
        FormSelector.email.classList.add("error");
        FormSelector.errorEmail.style.display = 'block';
        return false;
    } else {
        FormSelector.email.classList.remove("error");
        FormSelector.errorEmail.style.display = 'none';
        return true;
    }
}  