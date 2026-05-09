document.addEventListener('DOMContentLoaded', () => {
  // Intersection Observer for scroll animations
  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
  };

  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('slide-up');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  document.querySelectorAll('.service-card, .glass-card, .about-text-col p').forEach(el => {
    el.style.opacity = '0';
    observer.observe(el);
  });

  // Carousel Logic
  const track = document.querySelector('.carousel-track');
  const prevBtn = document.querySelector('.carousel-btn.prev');
  const nextBtn = document.querySelector('.carousel-btn.next');

  if (track && prevBtn && nextBtn) {
    const scrollAmount = () => {
      const card = track.querySelector('.testimonial-card');
      return card.offsetWidth + 24; // width + gap
    };

    nextBtn.addEventListener('click', () => {
      track.scrollBy({ left: scrollAmount(), behavior: 'smooth' });
    });

    prevBtn.addEventListener('click', () => {
      track.scrollBy({ left: -scrollAmount(), behavior: 'smooth' });
    });
  }

  // Mailto Form Submission Logic
  const form = document.getElementById('enquiry-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const formData = new FormData(form);
      const name = formData.get('name').trim();
      const email = formData.get('email').trim();
      const phone = formData.get('phone').trim();
      const service = formData.get('service');
      const current = formData.get('current').trim();
      const message = formData.get('message').trim();

      const subject = encodeURIComponent(`Website Enquiry: ${service} - ${name}`);
      
      let bodyText = `Name: ${name}\n`;
      bodyText += `Email: ${email}\n`;
      if (phone) bodyText += `Phone: ${phone}\n`;
      bodyText += `Service Needed: ${service}\n\n`;
      
      if (current) bodyText += `Currently paying: ${current}\n\n`;
      
      if (message) {
        bodyText += `Project Details:\n${message}\n`;
      }

      const body = encodeURIComponent(bodyText);
      
      // Open mailto link
      window.location.href = `mailto:matt@xfer.au?subject=${subject}&body=${body}`;
      
      // Optional: Change button text to indicate success
      const btn = form.querySelector('button[type="submit"]');
      const originalText = btn.innerHTML;
      btn.innerHTML = 'Opening Mail Client... ✓';
      btn.style.backgroundColor = '#10b981'; // success green
      
      setTimeout(() => {
        btn.innerHTML = originalText;
        btn.style.backgroundColor = ''; // revert to var(--primary)
        form.reset();
      }, 3000);
    });
  }
});
