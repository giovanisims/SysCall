var EditSelector, AddSelector;

document.addEventListener('DOMContentLoaded', function () {
    // Initialize the selectors for both forms
    EditSelector = loadEditSelectors();
    AddSelector = loadAddSelectors();
    
    // Set up event listeners
    setupEventListeners();

    // Exibe modal de sucesso se a URL tiver ?deleted=true, ?added=true ou ?edited=true
    const successModal = document.getElementById("successModal");
    const successMsg = document.getElementById("successMessageText");
    const closeBtn = document.getElementById("closeSuccessBtn");
    const params = new URLSearchParams(window.location.search);

    let message = "";
    if (params.get("deleted") === "true") {
        message = "Chamado excluído com sucesso!";
    } else if (params.get("added") === "true") {
        message = "Chamado adicionado com sucesso!";
    } else if (params.get("edited") === "true") {
        message = "Chamado editado com sucesso!";
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

    Array.from(document.getElementsByClassName('closeModalTicket')).forEach(element => {
        element.addEventListener('click', closeModalForm);
    });
});

// Load selectors for the Edit form
function loadEditSelectors() {
    return {
        // Form elements
        form: document.getElementById('editTicketForm'),
        title: document.getElementById('editTitle'),
        description: document.getElementById('editDescription'),
        priority: document.getElementById('editPriority'),
        type: document.getElementById('editType'),
        ticketId: document.getElementById('editTicketId'),
        // Buttons
        submitButtonVisible: document.getElementById('editSubmitButtonVisible'),
        submitButton: document.getElementById('editSubmitButton'),
        // Error messages
        errorTitle: document.getElementById('errorEditTitle'),
        errorDescription: document.getElementById('errorEditDescription'),
        errorFields: document.getElementById('errorEditFields')
    };
}

// Load selectors for the Add form
function loadAddSelectors() {
    return {
        // Form elements
        form: document.getElementById('formTicket'),
        title: document.getElementById('addTitle'),
        description: document.getElementById('addDescription'),
        priority: document.getElementById('addPriority'),
        type: document.getElementById('addType'),
        // Buttons
        submitButtonVisible: document.getElementById('addSubmitButtonVisible'),
        submitButton: document.getElementById('addSubmitButton'),
        // Error messages
        errorTitle: document.getElementById('errorAddTitle'),
        errorDescription: document.getElementById('errorAddDescription'),
        errorFields: document.getElementById('errorAddFields')
    };
}

// Set up event listeners for both forms
function setupEventListeners() {
    // Edit form events
    if (EditSelector.title) EditSelector.title.addEventListener('blur', function() { validateTitle(EditSelector); });
    if (EditSelector.description) EditSelector.description.addEventListener('blur', function() { validateDescription(EditSelector); });
    if (EditSelector.submitButtonVisible) EditSelector.submitButtonVisible.addEventListener('click', function() { validateForm(EditSelector); });
    
    // Add form events
    if (AddSelector.title) AddSelector.title.addEventListener('blur', function() { validateTitle(AddSelector); });
    if (AddSelector.description) AddSelector.description.addEventListener('blur', function() { validateDescription(AddSelector); });
    if (AddSelector.submitButtonVisible) AddSelector.submitButtonVisible.addEventListener('click', function() { validateForm(AddSelector); });
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
                // Fallback - if the button wasn't found through the selector
                if (selector === EditSelector) {
                    console.log("Using getElementById fallback for edit form");
                    document.getElementById('editSubmitButton').click();
                } else {
                    console.log("Using getElementById fallback for add form");
                    document.getElementById('addSubmitButton').click();
                }
            }
            
            // If the button click didn't work, submit the form directly
            setTimeout(() => {
                if (selector.form && !selector.form.getAttribute('data-submitted')) {
                    console.log("Button click didn't work, submitting form directly");
                    selector.form.setAttribute('data-submitted', 'true');
                    selector.form.submit();
                }
            }, 200);
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
    selector.errorFields.style.display = 'none';
    
    // Clear all field-specific errors
    const errorElements = document.querySelectorAll('.error-message');
    errorElements.forEach(el => {
        el.style.display = 'none';
    });
    
    // Remove error class from all inputs
    const inputElements = selector.form.querySelectorAll('input, select, textarea');
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

// Validate title
function validateTitle(selector) {
    var title = selector.title.value.trim();
    if (title.length > 0 && (title.length < 3 || title.length > 100)) {
        selector.title.classList.add('error');
        selector.errorTitle.style.display = 'block';
        return false;
    } else {
        selector.title.classList.remove('error');
        selector.errorTitle.style.display = 'none';
        return true;
    }
}

// Validate description
function validateDescription(selector) {
    var description = selector.description.value.trim();
    if (description.length > 0 && (description.length < 10 || description.length > 1000)) {
        selector.description.classList.add('error');
        selector.errorDescription.style.display = 'block';
        return false;
    } else {
        selector.description.classList.remove('error');
        selector.errorDescription.style.display = 'none';
        return true;
    }
}

// Original modal functions
function openEditModal(ticketId, title, description, priority, type) {
    // First, reset any existing form state and errors
    document.getElementById("editTicketForm").reset();
    resetErrorMessages(EditSelector);

    document.getElementById("editTicketId").value = ticketId;
    document.getElementById("editTitle").value = title;
    document.getElementById("editDescription").value = description;
    document.getElementById("editPriority").value = priority;
    document.getElementById("editType").value = type;
    document.getElementById("editModal").style.display = "block";
}

function closeEditModal() {
    document.getElementById("editModal").style.display = "none";
}

function openModalForm() {
    const modal = document.getElementById('modalOpenTicket');
    modal.classList.remove('hidden');
    modal.style.display = "block";
    
    // Reset form and error messages
    document.getElementById('formTicket').reset();
    resetErrorMessages(AddSelector);
}

function closeModalForm() {
    const modal = document.getElementById('modalOpenTicket');
    modal.classList.add('hidden');
    modal.style.display = "none";
    document.getElementById('formTicket').reset();
}

function openModal(ticketId) {
    const modal = document.getElementById("confirmationModal");
    const confirmButton = document.getElementById("confirmDeleteBtn");
    confirmButton.onclick = function () {
        window.location.href = `/tickets/delete/${ticketId}`;
    };
    modal.style.display = "block";
}

function closeModal() {
    document.getElementById("confirmationModal").style.display = "none";
}

// Fecha modais ao clicar fora
window.onclick = function (event) {
    const confirmationModal = document.getElementById("confirmationModal");
    const editModal = document.getElementById("editModal");
    const modalOpenTicket = document.getElementById("modalOpenTicket");
    const successModal = document.getElementById("successModal");

    if (event.target === confirmationModal) confirmationModal.style.display = "none";
    if (event.target === editModal) editModal.style.display = "none";
    if (event.target === modalOpenTicket) closeModalForm();
    if (event.target === successModal) successModal.style.display = "none";
};