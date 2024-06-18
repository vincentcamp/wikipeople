function handleFormSubmitNext(event) {
  event.preventDefault();

  let form = document.getElementById("next");
  let startTime = Date.now();

  form.submit();

  let timer = setTimeout(function () {
    let endTime = Date.now();
    let elapsedTime = (endTime - startTime) / 1000;
    if (elapsedTime > 5 && !form.submitted) {
      let logoTitle = document.querySelector(".logo--title");
      logoTitle.style.display = "none";
      let next = document.getElementById("next");
      next.style.display = "none";
      let previous = document.getElementById("previous");
      previous.style.display = "none";
      let search = document.getElementById("search");
      search.style.display = "none";
      let previousBtn = document.querySelector(".previous-icon");
      previousBtn.style.display = "none";
      let searchBtn = document.querySelector(".next-icon");
      searchBtn.style.display = "none";
      let button = document.querySelector(".btn-span");
      button.style.display = "none";
      let menu = document.querySelector(".hamburger-menu");
      menu.style.display = "none";
      let wiki = document.querySelector("iframe");
      wiki.style.display = "none";
    
      let loaderContainer = document.getElementById("loader-container");
      loaderContainer.style.display = "flex";
      loaderContainer.style.height = "100vh";
      let title = document.getElementById("title");
      title.style.display = "flex";
      let loader = document.querySelector(".loader");
      loader.style.display = "flex";
    }
  }, 5000);

  form.addEventListener("submit", function () {
    clearTimeout(timer);
  });
}

document.addEventListener("DOMContentLoaded", function () {
  const menuButton = document.querySelector(".hamburger-menu");
  const menu = document.querySelector(".menu-items");
  const closeButton = document.querySelector(".close-menu");

  function isClickOutsideMenu(event) {
    return !menu.contains(event.target) && !menuButton.contains(event.target);
  }

  menuButton.addEventListener("click", function () {
    const expanded = this.getAttribute("aria-expanded") === "true" || false;
    this.setAttribute("aria-expanded", !expanded);
    menu.style.right = expanded ? "-300px" : "0";
  });

  document.addEventListener("click", function (event) {
    if (isClickOutsideMenu(event)) {
      menu.setAttribute("aria-expanded", "false");
      menu.style.right = "-300px";
    }
  });

  closeButton.addEventListener("click", function () {
    menu.setAttribute("aria-expanded", "false");
    menu.style.right = "-300px";
  });
});

function getNamefromURL(url) {
  const parts = url.split("/");
  return parts[parts.length - 1].replace(/_/g, " ");
}

function updateRecentSearch() {
  const iframeSrc = document.getElementById("wiki-iframe").src;
  const name = decodeURIComponent(getNamefromURL(iframeSrc));
  const menuList = document.getElementById("menu-list");

  let recentPages = JSON.parse(localStorage.getItem("recentPages")) || [];
  if (!recentPages.includes(name)) {
    recentPages.push(name);
    localStorage.setItem("recentPages", JSON.stringify(recentPages));
  }
  recentPages = recentPages.map((page) =>
    decodeURIComponent(page.replace(/_/g, " "))
  );
  menuList.innerHTML = "";
  // menu items class
  recentPages.forEach((page) => {
    const menuItem = document.createElement("li");
    const menuItemLink = document.createElement("a");
    menuItemLink.textContent = page;
    menuItemLink.href = "#";
    menuItemLink.addEventListener("click", function (event) {
      event.preventDefault();
      document.getElementById(
        "wiki-iframe"
      ).src = `https://en.wikipedia.org/wiki/${page}`;
    });
    menuItem.appendChild(menuItemLink);
    menuList.appendChild(menuItem);
  });
}
//change in the iframe
document
  .getElementById("wiki-iframe")
  .addEventListener("load", updateRecentSearch);
