// Disable form submissions if there are invalid fields
(function () {
    'use strict';
    window.addEventListener('load', function () {
        // Get the forms we want to add validation styles to
        var forms = document.getElementsByClassName('needs-validation');
        // Loop over them and prevent submission
        var validation = Array.prototype.filter.call(forms, function (form) {

            form.addEventListener('submit', function (event) {
                if (form.checkValidity() === false) {
                    console.log('false validity');
                    event.preventDefault();
                    event.stopPropagation();
                }
                else if (form.checkValidity() === true){
                    $('.loader-wrapper').fadeIn();
                }
                form.classList.add('was-validated');
            }, false);
        });
    }, false);
})();

