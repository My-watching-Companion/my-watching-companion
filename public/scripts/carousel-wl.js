document.addEventListener("DOMContentLoaded", function () {
    const wrapper = document.querySelector(".carroussel-wrapper");
    const prevBtn = document.querySelector(".nav-left");
    const nextBtn = document.querySelector(".nav-right");

    let scrollAmount = 0;
    const scrollStep = 260;

    nextBtn.addEventListener("click", function () {
        if (scrollAmount < wrapper.scrollWidth - wrapper.clientWidth) {
            scrollAmount += scrollStep;
            wrapper.style.transform = `translateX(-${scrollAmount}px)`;
        }
    });

    prevBtn.addEventListener("click", function () {
        if (scrollAmount > 0) {
            scrollAmount -= scrollStep;
            wrapper.style.transform = `translateX(-${scrollAmount}px)`;
        }
    });
});
