$('a[href*="#"]').on('click', function(event) {
    let target = $(this.getAttribute('href').split('/')[2]);
    if (target.length) {
      event.preventDefault();
      $('html, body').animate({
        scrollTop: target.offset().top - 250
      }, 700);
    }
  });