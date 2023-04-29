window.onscroll = function () {
  scroll()
};

function scroll() {
  var topbar = document.body.scrollTop;
  if (topbar >= 100 ||
      document.documentElement.scrollTop >100) {
      document.getElementsByTagName('header')[0].classList.add("nav-shadow");
       document.getElementsByTagName('header')[0].classList.add("primary-bg");
   /*  document.querySelectorAll('header .address a')[0].classList.add("text-dark");
      document.querySelectorAll('header .address a')[0].classList.remove("text-white");
      document.querySelectorAll('header .address a')[1].classList.add("text-dark");
      document.querySelectorAll('header .address a')[1].classList.remove("text-white");*/

  } 
  else {
      document.getElementsByTagName('header')[0].classList.remove("nav-shadow");
      document.getElementsByTagName('header')[0].classList.remove("primary-bg");

    /*  document.querySelectorAll('header .address a')[0].classList.remove("text-dark");
      document.querySelectorAll('header .address a')[0].classList.add("text-white");
      document.querySelectorAll('header .address a')[1].classList.remove("text-dark");
      document.querySelectorAll('header .address a')[1].classList.add("text-white");*/

  }

}