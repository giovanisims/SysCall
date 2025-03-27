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

function random(min, max) {
    return Math.random() * (max-min) + min;
}

var deltaX = 0
var deltaY = 0;

addEventListener('mousemove', (e) => {
    deltaX = e.pageX - window.innerWidth/2;
    deltaY = e.pageY - window.innerHeight/2;
})

class Star {
    constructor(el, id) {
        this.el = el;
        this.id = id;
        this.sizeX = el.getBoundingClientRect().width;
        this.sizeY = el.getBoundingClientRect().height;
        this.x = random(0, window.innerWidth - this.sizeX);
        this.y = random(0, window.innerHeight - this.sizeY);
        this.vm = random(1, 3)/100; // velocity modifier
        this.velx_base = random(-4, 4);
        this.vely_base = random(-4, 4);
        this.velx = 0;
        this.vely = 0;
    }

    update() {
        this.velx = this.velx_base + deltaX * this.vm;
        this.vely = this.vely_base + deltaY * this.vm;
        this.x += this.velx;
        this.y += this.vely;

        if (this.x >= window.innerWidth + this.sizeX)
            this.x -= window.innerWidth + this.sizeX*2;

        if (this.x < -this.sizeX*2)
            this.x += window.innerWidth + this.sizeX*2;

        if (this.y >= window.innerHeight + this.sizeY)
            this.y -= window.innerHeight + this.sizeY*2;

        if (this.y < -this.sizeY*2)
            this.y += window.innerHeight + this.sizeY*2;

        this.el.style.top = `${this.y}px`
        this.el.style.left = `${this.x}px`
    }
}

function init() {
    const stars = Array.from( Array(30).keys() ).map(i => {
        let elm = document.createElement('div');
        elm.classList.add('star');
        let randomSize = Math.floor(Math.random() * (300 - 200 + 1)) + 200;
        elm.style.width = `${randomSize}px`;
        elm.style.height = `${randomSize}px`;
        console.log(elm);
        document.querySelector('#section-bg').appendChild(elm)
        let star = new Star(elm, i);
        
        star.el.style.top = `${star.y}px`
        star.el.style.left = `${star.x}px`

        return star;
    });

    let updateAll = () => {

        stars.forEach(star => {
            star.update();
        })

        // run once for static gradient
        requestAnimationFrame(updateAll);
    }

    requestAnimationFrame(updateAll)
}


document.addEventListener("DOMContentLoaded", function () {
    typeText();
    init();
});
