// Turns every <div class="photo-carousel"> into a slideshow: one photo
// visible at a time, with arrows and dots to step through the rest.
//
// Usage (inside a post):
//   <figure class="figure photo">
//     <div class="photo-carousel">
//       <img src="..." alt="...">
//       <img src="..." alt="...">
//     </div>
//     <figcaption>Caption for the set.</figcaption>
//   </figure>
//   ... and once, near the end of the page:
//   <script src="../assets/photo-carousel.js"></script>
//
// The photos only change when the reader clicks; nothing rotates by itself.
// Without JavaScript the photos simply stack.
(function () {
  Array.prototype.forEach.call(document.querySelectorAll('.photo-carousel'), function (el) {
    var slides = Array.prototype.slice.call(el.querySelectorAll('img'));
    if (slides.length < 2) return;

    var index = 0;

    slides.forEach(function (img) { img.loading = 'eager'; });

    var dots = document.createElement('div');
    dots.className = 'carousel-dots';
    var dotButtons = slides.map(function (_, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-label', 'Show photo ' + (i + 1) + ' of ' + slides.length);
      b.addEventListener('click', function () { show(i); });
      dots.appendChild(b);
      return b;
    });

    function arrow(className, label, text, step) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'carousel-arrow ' + className;
      b.setAttribute('aria-label', label);
      b.innerHTML = text;
      b.addEventListener('click', function () { show(index + step); });
      return b;
    }

    function show(i) {
      index = (i + slides.length) % slides.length;
      slides.forEach(function (img, k) {
        img.classList.toggle('is-active', k === index);
        img.setAttribute('aria-hidden', k === index ? 'false' : 'true');
      });
      dotButtons.forEach(function (b, k) {
        b.classList.toggle('is-active', k === index);
      });
    }

    el.appendChild(arrow('carousel-prev', 'Previous photo', '&#8249;', -1));
    el.appendChild(arrow('carousel-next', 'Next photo', '&#8250;', 1));
    el.appendChild(dots);
    el.classList.add('is-ready');
    show(0);
  });
})();
