document.addEventListener("DOMContentLoaded", function () {
    typeText();
});
const text = "Gerencie seus chamados de TI de forma eficiente!";
const typingElement = document.getElementById("typing-text");
let index = 0;

function typeText() {
    if (index < text.length) {
        typingElement.textContent += text.charAt(index);
        index++;
        setTimeout(typeText, 100);
    } else {
        typingElement.style.borderRight = "none";
    }
}