const body = $("body");
const search = $("#search");
const today = $("#today");
const weather = $("#weather");
const ui = $("#ui");
const historyEl = $("<section>");

let searchEl;

//Get API Keys from AWS Lambda
const apiURL = 'https://zx3eyuody3fc25me63au7ukbki0jqehi.lambda-url.us-east-2.on.aws/'
let config = {}
fetch(apiURL).then((res) => {
  if (res.ok)
    res.json().then((data) => {
      console.log(data)
      config = data;
    });
});

console.log(config)
const DateTime = luxon.DateTime;
const background = {
  clouds: "assets/images/clouds.jpg",
  rain: "assets/images/raining.jpg",
  clear: "assets/images/sunny.jpg",
  thunderstorm: "assets/images/thunderstorm.jpg",
  night: "assets/images/night.jpg",
  sunrise: "assets/images/sunrise.jpg",
  sunset: "assets/images/sunset.jpg",
};

let searchHistory = JSON.parse(localStorage.getItem("rainCheck"));
searchHistory = !!searchHistory ? searchHistory : {};
// console.log(searchHistory);

weather.hide();
ui.width("375");

const createSearch = () => {
  //Search Location
  const searchInput = $("<input/>");
  const searchLabel = $("<label/>");
  searchInput
    .attr({ id: "search-input", placeholder: "Search Location", type: "text" })
    .addClass("form-control mb-3");
  searchLabel
    .attr("for", "search-input")
    .text("Search Location")
    .addClass("m-3");
  search.append(searchInput, searchLabel);
  searchEl = $("#search-input");

  //Get Weather Button
  const searchBtn = $("<button/>");
  searchBtn
    .text("Get Weather")
    .click(getLocation)
    .attr("id", "searchBtn")
    .addClass("btn btn-primary mb-1 align-self-end");
  search.append(searchBtn);
  const hr = $("<hr>");
  search.append(hr);

  showHistory();
};

//History
const showHistory = () => {
  let searches = Object.keys(searchHistory);
  historyEl.addClass("container");
  search.append(historyEl);
  const numShow = 14;
  let maxHistory = searches.length >= numShow ? -numShow : -searches.length;
  searches = searches.slice(maxHistory);
  searches.forEach((history) => {
    addToHistory(history);
  });
};

const addToHistory = (history) => {
  const historyBtn = $("<button/>");
  const rowContainer = $("<div>");
  historyBtn
    .text(history)
    .click(getLocation)
    .addClass("btn btn-info mb-3")
    .attr("id", "historyBtn");
  rowContainer.addClass("row").append(historyBtn);
  historyEl.append(rowContainer);
};

//Get Search Coordinates
const getLocation = (e) => {
  weather.fadeOut();
  const tgt = $(e.target);
  const location =
    tgt[0].id === "searchBtn" ? searchEl.val() : tgt[0].textContent;
  const apiKey = config.GOOGLE_API;
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${location}&key=${apiKey}`;
  fetch(url).then((res) => {
    if (res.ok)
      res.json().then((data) => {
        const coord = data.results[0].geometry.location;
        searchHistory[location] = coord;
        localStorage.setItem("rainCheck", JSON.stringify(searchHistory));
        if (tgt[0].id === "searchBtn") addToHistory(location);
        ui.width("1500");
        weather.fadeIn();
        getWeather(coord.lat, coord.lng, location);
      });
  });
};

//Get Weather from Coordinates
const getWeather = (lat, lon, loc) => {
  let url = `https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&appid=${config.OW_API}&units=imperial`;
  fetch(url).then((res) => {
    if (res.ok)
      res.json().then((data) => {
        displayWeather(data, loc, today);
      });
  });
};

//Convert WindDeg to Direction
function degToCompass(num) {
  var val = Math.floor(num / 22.5 + 0.5);
  var arr = [
    "N",
    "NNE",
    "NE",
    "ENE",
    "E",
    "ESE",
    "SE",
    "SSE",
    "S",
    "SSW",
    "SW",
    "WSW",
    "W",
    "WNW",
    "NW",
    "NNW",
  ];
  return arr[val % 16];
}

//Contruct Weather Modules
const displayWeather = (data, loc, today) => {
  let id = today.attr("id");
  const timezone = data.timezone;
  const current = id === "today" ? data.current : data;
  const sunrise = DateTime.fromSeconds(current.sunrise).setZone(timezone);
  const sunset = DateTime.fromSeconds(current.sunset).setZone(timezone);
  let currentDate = DateTime.fromSeconds(current.dt);
  let fullTime = currentDate.setZone(timezone);
  let now = fullTime.toLocaleString(DateTime.TIME_SIMPLE);
  let time = currentDate.setZone(timezone).startOf("hour");
  let date = currentDate.toLocaleString(DateTime.DATE_MED_WITH_WEEKDAY);
  let temp = current.temp.day;
  
  

  ui.css("opacity", 0.93);

  today.empty();
  body.attr({ opacity: 0 });

  //City Title
  const city = $("<h2>");
  let timeStr = "";
  let sunriseSep = "<br>";
  if (id === "today") {
    let weatherType;

    if (Math.abs(time.hour - sunrise.hour) == 0) {
      weatherType = "sunrise";
    } else if (Math.abs(sunset.hour - time.hour) == 0) {
      weatherType = "sunset";
    } else if (sunset.hour < time.hour || time.hour < sunrise.hour) {
      weatherType = "night";
    } else {
      weatherType = current.weather[0].main.toString().toLowerCase();
    }
    let bgSrc = background[weatherType];
    body.css({ background: `url(${bgSrc}) center`, opacity: 1 });
    city.text(`${loc} -- `);
    temp = current.temp;
    timeStr = `<h5> @ ${now}</h5>`;
    sunriseSep = " ";
  } else {
    date = date.substring(0, date.lastIndexOf(","));
  }

  city.append(`<i>${date}</i>${timeStr}`);

  //Weather Icons
  const icon = current.weather[0].icon;
  const iconEl = $("<img>");
  const desc = current.weather[0].description;
  const descEl = $("<p>");
  descEl.html(
    `<i>${desc}</i><br><i class="fa-solid fa-sun"></i> ${sunrise.toLocaleString(
      DateTime.TIME_SIMPLE
    )} ${sunriseSep} <i class="fa-regular fa-sun"></i> ${sunset.toLocaleString(
      DateTime.TIME_SIMPLE
    )}`
  );
  iconEl.attr("src", `http://openweathermap.org/img/wn/${icon}@2x.png`);

  //temperature
  const tempEl = $("<p>");
  const feelsLike =
    id === "today" ? current.feels_like : current.feels_like.day;
  tempEl.html(
    `<b>Temperature:</b> ${temp}&deg;F <br>&ensp;-- <i>Feels Like: ${feelsLike}&deg;F</i>`
  );

  //wind
  const windEl = $("<p>");
  const windSpeed = current.wind_speed;
  const windDeg = current.wind_deg;
  const windDir = degToCompass(windDeg);

  windEl.html(`<b>Wind:</b> ${windSpeed} MPH <i>${windDir}</i>`);

  //humidity
  const humidityEl = $("<p>");
  const humidity = current.humidity;
  humidityEl.html(`<b>Humidity:</b> ${humidity}%`);

  //UV Index
  const uvEl = $("<p>");
  const uvIndex = current.uvi;
  const uviBtn = $("<button>");
  const uvLevels = ["success", "warning", "danger"];
  const uvLevel = uvLevels[Math.min(Math.floor(uvIndex / 4), 2)];
  uvEl.html(`<b>UV Index:</b> `);
  uviBtn.text(uvIndex).addClass(`btn btn-${uvLevel}`);
  uvEl.append(uviBtn);

  today.append(city, iconEl, descEl, tempEl, windEl, humidityEl, uvEl);

  if (today.attr("id") === "today")
    today.animate(
      {
        top: 0,
        opacity: 1,
      },
      500,
      () => {
        displayForecast(data, loc);
      }
    );
};

//Show Forcast Modules
const displayForecast = (data, loc) => {
  const forecastEl = $("#forecast");
  const forcastRow = $("<div>");
  let forecast = data.daily;

  forecast = forecast.splice(1, 5);
  
  forecastEl.empty();
  forecastEl.addClass("container");
  
  forcastRow.addClass("row");
  forecastEl.append(forcastRow);
  forecast.forEach((day, i) => {
    const forecastDay = $("<section>");
    forecastDay.addClass("col m-2 p-2");
    displayWeather(day, loc, forecastDay);
    forcastRow.append(forecastDay);
  });
};

//Initialize Search Box
createSearch();
