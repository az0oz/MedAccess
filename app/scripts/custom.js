(function ($) {
  "use strict";

  // menu fixed js code
  //window.scrollBy(x, y);
  $(window).scroll(function () {
    
    var window_top = $(window).scrollTop() + 1;
    if (window_top > 230) {
      console.log(window_top);
        $('.main_menu').addClass('menu_fixed animated fadeInDown');
      } else {
        $('.main_menu').removeClass('menu_fixed animated fadeInDown');
      }
    
  });

var review = $('.client_review_part');
if (review.length) {
  review.owlCarousel({
    items: 1,
    loop: true,
    dots: true,
    autoplay: true,
    autoplayHoverPause: true,
    autoplayTimeout: 5000,
    nav: false,
    smartSpeed: 2000,
  });
}



}(jQuery));