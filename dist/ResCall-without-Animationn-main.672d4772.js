// ✅ Signup Button Click
const signupBtn = document.getElementById("signupFreeBtn");
if (signupBtn) signupBtn.addEventListener("click", ()=>{
    window.location.href = "signup.html";
});
// ✅ SmoothScroll with LocomotiveScroll + ScrollTrigger
function SmoothScroll() {
    gsap.registerPlugin(ScrollTrigger);
    const locoScroll = new LocomotiveScroll({
        el: document.querySelector(".main"),
        smooth: true
    });
    locoScroll.on("scroll", ScrollTrigger.update);
    ScrollTrigger.scrollerProxy(".main", {
        scrollTop (value) {
            return arguments.length ? locoScroll.scrollTo(value, 0, 0) : locoScroll.scroll.instance.scroll.y;
        },
        getBoundingClientRect () {
            return {
                top: 0,
                left: 0,
                width: window.innerWidth,
                height: window.innerHeight
            };
        },
        pinType: document.querySelector(".main").style.transform ? "transform" : "fixed"
    });
    ScrollTrigger.addEventListener("refresh", ()=>locoScroll.update());
    ScrollTrigger.refresh();
    return locoScroll;
}
_c = SmoothScroll;
const locoScroll = SmoothScroll();
document.querySelectorAll("[data-scroll-to]").forEach((trigger)=>{
    trigger.addEventListener("click", (e)=>{
        e.preventDefault();
        const target = trigger.getAttribute("data-scroll-to");
        const element = document.querySelector(target);
        if (element) locoScroll.scrollTo(element);
    });
});
// ✅ Smooth Custom Cursor
const cursor = document.querySelector(".cursor-follower");
const main = document.querySelector(".main");
let mouseX = 0, mouseY = 0, currentX = 0, currentY = 0;
const speed = 0.1;
main.addEventListener("mousemove", (e)=>{
    mouseX = e.clientX;
    mouseY = e.clientY;
});
function animateCursor() {
    const distX = mouseX - currentX;
    const distY = mouseY - currentY;
    currentX += distX * speed;
    currentY += distY * speed;
    cursor.style.left = `${currentX}px`;
    cursor.style.top = `${currentY}px`;
    requestAnimationFrame(animateCursor);
}
animateCursor();
// ✅ GSAP Animations
function Animations() {
    const animOpts = {
        ease: "power2.out",
        scroller: ".main"
    };
    gsap.from(".hero h1", {
        y: 50,
        opacity: 0,
        duration: 1,
        stagger: 0.2,
        scrollTrigger: {
            trigger: ".hero",
            start: "top 80%",
            ...animOpts
        }
    });
    gsap.from(".hero p, .hero .btn", {
        opacity: 0,
        y: 20,
        duration: 1,
        delay: 0.6,
        scrollTrigger: {
            trigger: ".hero",
            start: "top 80%",
            ...animOpts
        }
    });
    gsap.from("#right-hero img", {
        opacity: 0,
        x: 50,
        duration: 1,
        delay: 0.3,
        scrollTrigger: {
            trigger: ".hero",
            start: "top 80%",
            ...animOpts
        }
    });
    gsap.from(".step", {
        opacity: 0,
        y: 30,
        stagger: 0.3,
        duration: 1,
        scrollTrigger: {
            trigger: ".steps",
            start: "top 80%",
            toggleActions: "play none none reverse",
            ...animOpts
        }
    });
    gsap.from(".feedback-box", {
        opacity: 0,
        y: 40,
        stagger: 0.3,
        duration: 1.2,
        scrollTrigger: {
            trigger: ".user-feedback",
            start: "top 85%",
            toggleActions: "play none none reverse",
            ...animOpts
        }
    });
    gsap.from(".pricing-card", {
        scale: 0.95,
        opacity: 0,
        stagger: 0.2,
        duration: 1,
        ease: "back.out(1.7)",
        scrollTrigger: {
            trigger: ".pricing-cards",
            start: "top 85%",
            toggleActions: "play none none reverse",
            ...animOpts
        }
    });
    gsap.from(".upload-section", {
        opacity: 0,
        y: 50,
        duration: 1,
        scrollTrigger: {
            trigger: ".upload-section",
            start: "top 85%",
            ...animOpts
        }
    });
    gsap.from(".about-content p", {
        opacity: 0,
        y: 30,
        stagger: 0.2,
        duration: 1,
        scrollTrigger: {
            trigger: ".about-content",
            start: "top 90%",
            ...animOpts
        }
    });
    gsap.from(".member", {
        scale: 0.8,
        opacity: 0,
        stagger: 0.2,
        duration: 0.8,
        ease: "back.out(1.7)",
        scrollTrigger: {
            trigger: ".team-members",
            start: "top 85%",
            ...animOpts
        }
    });
}
_c1 = Animations;
Animations();
var _c, _c1;
$RefreshReg$(_c, "SmoothScroll");
$RefreshReg$(_c1, "Animations");

//# sourceMappingURL=ResCall-without-Animationn-main.672d4772.js.map
