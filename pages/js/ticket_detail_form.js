var FormSelector;

document.addEventListener('DOMContentLoaded', function () {
    // Initialize the form selector
    FormSelector = loadFormSelectors();
    
    // Set up event listeners
    setupEventListeners();
});

// Load selectors for the form
function loadFormSelectors() {
    return {
        // Form elements
        form: document.querySelector('form'),
        answerTitle: document.getElementById('answer_title'),
        answerDescription: document.getElementById('answer_description'),
        
        // Buttons
        submitButtonVisible: document.getElementById('submitButtonVisible'),
        submitButton: document.getElementById('submitButton'),
        
        // Error messages
        errorAnswerTitle: document.getElementById('errorAnswerTitle'),
        errorAnswerDescription: document.getElementById('errorAnswerDescription'),
        errorRequiredFields: document.getElementById('errorRequiredFields')
    };
}

// Set up event listeners for the form
function setupEventListeners() {
    if (FormSelector.answerTitle) {
        FormSelector.answerTitle.addEventListener('blur', function() { 
            validateTitle(FormSelector); 
        });
    }
    
    if (FormSelector.answerDescription) {
        FormSelector.answerDescription.addEventListener('blur', function() { 
            validateDescription(FormSelector); 
        });
    }
    
    if (FormSelector.submitButtonVisible) {
        FormSelector.submitButtonVisible.addEventListener('click', function() { 
            validateForm(FormSelector); 
        });
    }
}

// Form validation and submission
function validateForm(selector) {
    const valid = validateAllFields(selector);
    
    if (valid) {
        // Submit the form
        console.log("Submitting form", selector.form.id);
        try {
            if (selector.submitButton) {
                console.log("Clicking submit button");
                selector.submitButton.click();
            } else {
                // Fallback - submit the form directly
                selector.form.submit();
            }
        } catch (e) {
            console.error("Error submitting form:", e);
            // Last resort - direct form submission
            selector.form.submit();
        }
    }
}

// Validate all form fields
function validateAllFields(selector) {
    resetErrorMessages(selector);
    
    const emptyFieldsValid = validateEmptyFields(selector);
    const titleValid = validateTitle(selector);
    const descriptionValid = validateDescription(selector);
    
    return emptyFieldsValid && titleValid && descriptionValid;
}

// Reset all error messages
function resetErrorMessages(selector) {
    selector.errorRequiredFields.style.display = 'none';
    
    // Clear all field-specific errors
    const errorElements = document.querySelectorAll('.error-message');
    errorElements.forEach(el => {
        el.style.display = 'none';
    });
    
    // Remove error class from all inputs
    const inputElements = selector.form.querySelectorAll('input, textarea');
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
        selector.errorRequiredFields.style.display = 'block';
        return false;
    }
    return true;
}

// Validate title
function validateTitle(selector) {
    var title = selector.answerTitle.value.trim();
    if (title.length > 0 && (title.length < 3 || title.length > 100)) {
        selector.answerTitle.classList.add('error');
        selector.errorAnswerTitle.style.display = 'block';
        return false;
    } else {
        selector.answerTitle.classList.remove('error');
        selector.errorAnswerTitle.style.display = 'none';
        return true;
    }
}

// Validate description
function validateDescription(selector) {
    var description = selector.answerDescription.value.trim();
    if (description.length > 0 && (description.length < 10 || description.length > 1000)) {
        selector.answerDescription.classList.add('error');
        selector.errorAnswerDescription.style.display = 'block';
        return false;
    } else {
        selector.answerDescription.classList.remove('error');
        selector.errorAnswerDescription.style.display = 'none';
        return true;
    }
}