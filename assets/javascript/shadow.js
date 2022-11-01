window.onscroll = function () {
  scroll()
};

function scroll() {
  var topbar = document.body.scrollTop;
  if (topbar >= 100 ||
      document.documentElement.scrollTop >100) {
      document.getElementsByTagName('header')[0].classList.add("nav-shadow");

  } 
  else {
      document.getElementsByTagName('header')[0].classList.remove("nav-shadow");

  }

}