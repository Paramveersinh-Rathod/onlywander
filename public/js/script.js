(() => {
  'use strict'

  // Fetch all the forms we want to apply custom Bootstrap validation styles to
  const forms = document.querySelectorAll('.needs-validation')

  // Loop over them and prevent submission
  Array.from(forms).forEach(form => {
    form.addEventListener('submit', event => {
      if (!form.checkValidity()) {
        event.preventDefault()
        event.stopPropagation()
      }

      form.classList.add('was-validated')
    }, false)
  })
})()


document.addEventListener('DOMContentLoaded', () => {
    const loadingOverlay = document.getElementById('loading-overlay');
    // Selects any form with the class 'form-with-loader'
    const formsWithLoader = document.querySelectorAll('.form-with-loader');

    formsWithLoader.forEach(form => {
        form.addEventListener('submit', (event) => {
            // Only show loader if the form is valid
            if (form.checkValidity()) {
                if(loadingOverlay) {
                    // THE FIX: Reset the opacity and remove any transitions
                    // to make the loader appear instantly on form submission.
                    loadingOverlay.style.transition = 'none';
                    loadingOverlay.style.opacity = '1';
                    loadingOverlay.style.display = 'flex';
                }
            }
        });
    });
});
