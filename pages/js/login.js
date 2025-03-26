document.addEventListener('DOMContentLoaded', function() {
    loadSelectors();
    loadEvents();
});

function loadSelectors(){
    var email = document.getElementById('email');
    var password = document.getElementById('password');
    var submitButtonVisible = document.getElementById('submitButtonVisible')
    var errorFields = document.getElementById('errorFields');
}
function loadEvents(){
    submitButtonVisible.addEventListener('click', validateForm);
}
function validateForm(){
    resetErrorMessages()
    var emptyFieldsValid = validateEmptyFields()
    if(emptyFieldsValid){
        document.getElementById('submitButton').click()
    }
}
function resetErrorMessages(){
    errorFields.style.display = 'none';
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
//  