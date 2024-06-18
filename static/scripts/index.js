document.addEventListener("DOMContentLoaded", function () {
  const databaseMode = document.querySelector(
    "input[name='mode'][value='database']"
  );
  const randomMode = document.querySelector(
    "input[name='mode'][value='random']"
  );
  const submitButton = document.querySelector("input[type='submit']");
  const sliderThumbs = document.querySelectorAll("input[type='range']");

  fetch("/static/colleges.json")
    .then((response) => response.json())
    .then((data) => {
      const inputField = document.getElementById("college-name-input");
      const optionsContainer = document.getElementById("colleges-list");
      const uniqueColleges = Array.from(
        new Set(data.map((college) => college.universityLabel))
      ).map((label) => {
        return data.find((college) => college.universityLabel === label);
      });

      uniqueColleges.forEach((college) => {
        const optionDiv = document.createElement("div");
        optionDiv.classList.add("custom-option");
        optionDiv.textContent = college.universityLabel;
        optionDiv.dataset.value = college.universityLabel;
        optionDiv.dataset.inceptionYear = college.inceptionYear; // Store inception year in the option
        optionsContainer.appendChild(optionDiv);

        optionDiv.addEventListener("click", function () {
          inputField.value = this.dataset.value;
          document.getElementById("college-input").value = this.dataset.value;
          const inceptionYear = parseInt(this.dataset.inceptionYear);
          let selectedYear = document.getElementById("start_year_input").value;
          let defaultYear = Math.max(0, inceptionYear - 100);


          if (selectedYear === "The Beginning of Time"||selectedYear===defaultYear) {
            document.getElementById("fromSlider").min = defaultYear;
            document.getElementById("fromSlider").value = defaultYear;
            document.getElementById("start_year_input").value = defaultYear;
          } 
          else{
            document.getElementById("fromSlider").min = defaultYear;
            if (selectedYear<defaultYear) {
              document.getElementById("fromSlider").value = defaultYear;
              document.getElementById("start_year_input").value = defaultYear;
          }
        }
          optionsContainer.classList.remove("open");
        });
      });

      inputField.addEventListener("input", function () {
        const searchQuery = inputField.value.toLowerCase();
        const options = optionsContainer.querySelectorAll(".custom-option");

        options.forEach((option) => {
          const match = option.textContent.toLowerCase().includes(searchQuery);
          option.style.display = match ? "block" : "none";
        });
      });
    })

    .catch((error) => console.error("Error fetching colleges:", error));

  // Close the custom select when clicking outside
  document.addEventListener("click", function (e) {
    const select = document.querySelector(".custom-select");
    if (!select.contains(e.target)) {
      select.classList.remove("open");
    }
  });
  // Toggle the dropdown open/close on input field focus
  const trigger = document.querySelector(".custom-select__trigger input");
  trigger.addEventListener("focus", () => {
    document.querySelector(".custom-select").classList.add("open");
    document.querySelector(".occupation-select").classList.remove("open");
  });
  trigger.addEventListener("click", (e) => {
    e.stopPropagation(); // Prevent the wrapper click event from toggling the class immediately
  });

  fetch("/static/occupations.json")
    .then((response) => response.json())
    .then((data) => {
      const occupations = data;
      const occupationInput = document.getElementById("occupation-name-input");
      const occupationsList = document.getElementById("occupations-list");
      function matchOccupation(occupation, query) {
        return occupation.occupationLabel.toLowerCase().includes(query);
      }
      function fillOccupationList(searchQuery) {
        occupationsList.innerHTML = "";
        occupations.forEach((occupation) => {
          if (matchOccupation(occupation, searchQuery)) {
            const optionDiv = document.createElement("div");
            optionDiv.classList.add("occupation-option");
            optionDiv.textContent = occupation.occupationLabel;
            optionDiv.dataset.value = occupation.occupationLabel;

            optionDiv.addEventListener("click", function () {
              occupationInput.value = this.dataset.value;
              document.getElementById("occupation-input").value =
                this.dataset.value;
              occupationsList.innerHTML = "";
            });
            occupationsList.appendChild(optionDiv);
          }
        });
      }
      occupationInput.addEventListener("input", function () {
        const searchQuery = occupationInput.value.toLowerCase();
        fillOccupationList(searchQuery);
      });
      occupationInput.addEventListener("focus", function () {
        const searchQuery = occupationInput.value.toLowerCase();
        fillOccupationList(searchQuery);
      });
    })
    .catch((error) => {
      console.error(
        "There has been a problem with your fetch operation:",
        error
      );
    });

  document.addEventListener("click", function (e) {
    const selectOccupation = document.querySelector(".occupation-select");
    if (!selectOccupation.contains(e.target)) {
      selectOccupation.classList.remove("open");
    }
  });
  // Toggle the dropdown open/close on input field focus
  const triggerOccupation = document.querySelector(
    ".occupation-select__trigger input"
  );
  triggerOccupation.addEventListener("focus", () => {
    document.querySelector(".occupation-select").classList.add("open");
  });
  triggerOccupation.addEventListener("click", (e) => {
    e.stopPropagation(); // Prevent the wrapper click event from toggling the class immediately
  });
});

document.getElementById("start_year_input").value = "0"; // Default start year
document.getElementById("end_year_input").value = "2024"; // Default end year
updateYearValues();
document
  .querySelector("input[type='submit']")
  .addEventListener("click", function (event) {
    event.preventDefault();
    let progress = 0;
    const loadingBar = document.getElementById("loading-bar");
    loadingBar.style.display = "block";
    loadingBar.style.width = "0%";

    const interval = setInterval(function () {
      progress += 10;
      loadingBar.style.width = progress + "%";

      if (progress >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          loadingBar.style.display = "none";
          alert("Query complete!");
        }, 500);
      }
    }, 100);
  });
document.querySelectorAll(".year-input-container input").forEach((input) => {
  input.addEventListener("blur", function () {
    hideInput(this.id);
  });
  input.addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
      this.blur();
    }
  });
});
function updateYearValues() {
  const fromYearSlider = document.getElementById("fromSlider");
  const toYearSlider = document.getElementById("toSlider");
  const startYearInput = document.getElementById("start_year_input");
  const endYearInput = document.getElementById("end_year_input");

  if (parseInt(toYearSlider.value) < parseInt(fromYearSlider.value)) {
    fromYearSlider.value = toYearSlider.value;
  }

  startYearInput.value =
    fromYearSlider.value === "0"
      ? "The Beginning of Time"
      : fromYearSlider.value;
  endYearInput.value =
    toYearSlider.value === "0" ? "The Beginning of Time" : toYearSlider.value;

  document.getElementById("start_year").value = fromYearSlider.value;
  document.getElementById("end_year").value = toYearSlider.value;
}

function updateColorsForMode() {
  if (databaseMode.checked) {
    submitButton.style.backgroundColor = "#ADD8E6";
    sliderThumbs.forEach((slider) => {
      slider.style.setProperty("--slider-thumb-background", "#ADD8E6");
    });
  } else if (randomMode.checked) {
    submitButton.style.backgroundColor = "#90EE90";
    sliderThumbs.forEach((slider) => {
      slider.style.setProperty("--slider-thumb-background", "#90EE90");
    });
  }
}

updateColorsForMode();

function showInput(id) {
  var input = document.getElementById(id);
  var display = document.getElementById(id + "_display");
  input.style.display = "inline";
  input.focus();
  display.style.display = "none";
}

function hideInput(id) {
  var input = document.getElementById(id);
  var display = document.getElementById(id + "_display");
  if (document.activeElement !== input) {
    input.style.display = "none";
    display.style.display = "inline";
  }
}

function clearDates() {
  const fromSlider = document.getElementById("fromSlider");
  const toSlider = document.getElementById("toSlider");
  fromSlider.value = 0;
  fromSlider.min = 0;
  toSlider.value = new Date().getFullYear();
  document.getElementById("start_year_input").value = "The Beginning of Time";
  document.getElementById("end_year_input").value = toSlider.value;
  document.getElementById("college-name-input").value = "";
  document.getElementById("college-input").value = "";
  document.getElementById("occupation-name-input").value = "";
  document.getElementById("occupation-input").value = "";
}

function handleManualDateEntry(event, sliderId) {
  const slider = document.getElementById(sliderId);
  let year = parseInt(event.target.value, 10);

  if (
    isNaN(year) ||
    event.target.value.toLowerCase() === "the beginning of time"
  ) {
    year = sliderId === "fromSlider" ? 0 : new Date().getFullYear();
  }

  slider.value = year;
  updateYearValues();
}

document.getElementById("fromSlider").addEventListener("input", function () {
  if (this.value > 0 && this.min === "0") {
    this.min = 1900;
    this.value = Math.max(this.value, 1900);
    updateYearValues();
  } else {
    updateYearValues();
  }
});
databaseMode.addEventListener("change", updateColorsForMode);
randomMode.addEventListener("change", updateColorsForMode);
document
  .getElementById("fromSlider")
  .addEventListener("input", updateYearValues);
document.getElementById("toSlider").addEventListener("input", updateYearValues);

function handleFormSubmit(event) {
  event.preventDefault();
      let logoTitle = document.querySelector(".logo--title");
      let footer = document.querySelector("footer");
      let form = document.getElementById("myForm");
      let loaderContainer = document.getElementById("loader-container");
      let title = document.getElementById("title");
      let loader = document.querySelector(".loader");
      logoTitle.style.display = "none";
      footer.style.display = "none";
      form.style.display = "none";
      loaderContainer.style.display = "flex";
      loaderContainer.style.height = "100vh";
      title.style.display = "flex";
      loader.style.display = "flex";
      setTimeout(function () {
        form.submit(); // Submit
      }, 2000);
}
