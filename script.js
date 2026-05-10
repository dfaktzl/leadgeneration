document.addEventListener('DOMContentLoaded', () => {
  // Typing Effect
  const typeChunks = [
    "Premium",
    " Web",
    " &",
    " Tech",
    " Solutions.",
    "<br><span class='highlight'>Honest",
    " Perth",
    " Prices.</span>"
  ];
  
  const typewriterElement = document.getElementById('typewriter');
  if (typewriterElement) {
    let typeIndex = 0;
    function typeNext() {
      if (typeIndex < typeChunks.length) {
        typewriterElement.innerHTML += typeChunks[typeIndex];
        typeIndex++;
        setTimeout(typeNext, 250);
      }
    }
    setTimeout(typeNext, 400);
  }

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

  // Bill Upload Logic
  const dropzone = document.getElementById('upload-dropzone');
  const fileInput = document.getElementById('bill-file');
  const previewEl = document.getElementById('upload-preview');
  const previewName = document.getElementById('preview-name');
  const removeBtn = document.getElementById('upload-remove');
  const submitBtn = document.getElementById('upload-submit');
  const successEl = document.getElementById('upload-success');

  let selectedFile = null;
  const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
  const ACCEPTED = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp'];

  function showFile(file) {
    if (!ACCEPTED.includes(file.type)) {
      alert('Please upload a PDF, PNG, JPG, or WebP file.');
      return;
    }
    if (file.size > MAX_SIZE) {
      alert('File is too large. Maximum size is 10 MB.');
      return;
    }
    selectedFile = file;
    previewName.textContent = file.name;
    dropzone.hidden = true;
    previewEl.hidden = false;
  }

  if (dropzone) {
    // Click to browse
    dropzone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', () => {
      if (fileInput.files.length) showFile(fileInput.files[0]);
    });

    // Drag and drop
    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.classList.add('drag-over');
    });
    dropzone.addEventListener('dragleave', () => {
      dropzone.classList.remove('drag-over');
    });
    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.classList.remove('drag-over');
      if (e.dataTransfer.files.length) showFile(e.dataTransfer.files[0]);
    });

    // Remove file
    removeBtn.addEventListener('click', () => {
      selectedFile = null;
      fileInput.value = '';
      previewEl.hidden = true;
      dropzone.hidden = false;
    });

    // Submit — opens mailto with instructions to attach
    submitBtn.addEventListener('click', () => {
      if (!selectedFile) return;
      const subject = encodeURIComponent('Beat My Bill — Bill Upload');
      const body = encodeURIComponent(
        `Hi,\n\nI'd like you to beat my current bill.\n\nFile name: ${selectedFile.name}\n\n⚠️ Please attach the file "${selectedFile.name}" to this email before sending.\n\nThanks!`
      );
      window.location.href = `mailto:matt@xfer.au?subject=${subject}&body=${body}`;

      // Show success state
      previewEl.hidden = true;
      successEl.hidden = false;
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
