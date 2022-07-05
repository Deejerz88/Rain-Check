const body = $("body");
const search = $("#search");
const today = $("#today");
const weather = $("#weather");
const ui = $("#ui");
let searchEl;

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

let searchHistory = JSON.parse(localStorage.getItem("weatherHistory"));
searchHistory = !!searchHistory ? searchHistory : {};
console.log(searchHistory);

const historyEl = $("<section>");

weather.hide();
ui.width("375");

const createSearch = () => {
  //Search Location
  const searchInput = $("<input/>");
  searchInput
    .attr({ id: "search-input", placeholder: "Search City", type: "text" })
    .addClass("form-control mb-3");
  const searchLabel = $("<label/>");
  searchLabel.attr("for", "search-input").text("Search Location").addClass("m-3");
  search.append(searchInput).append(searchLabel);
  searchEl = $("#search-input");

  //Get Weather Button
  const searchBtn = $("<button/>");
  searchBtn
    .text("Get Weather")
    .click(getLocation)
    .attr("id", "searchBtn")
    .addClass("btn btn-primary mb-1 align-self-end");
  search.append(searchBtn);
  const hr = $('<hr>')
  search.append(hr)

  showHistory();
};

//History
const showHistory = () => {
  console.log("showing hisotry");
  let searches = Object.keys(searchHistory);
  console.log(searches);

  historyEl.addClass("container");
  search.append(historyEl);
  const numShow = 14
  let maxHistory = searches.length >= numShow ? -numShow : -searches.length;
  console.log(maxHistory);
  searches = searches.slice(maxHistory);
  console.log({ searches });
  searches.forEach((history) => {
    addToHistory(history);
  });
};

const addToHistory = (history) => {
  const historyBtn = $("<button/>");
  const rowContainer = $("<div>");
  rowContainer.addClass("row");
  historyBtn.text(history).click(getLocation).addClass("btn btn-info mb-3");
  rowContainer.append(historyBtn.attr("id", "historyBtn"));
  historyEl.append(rowContainer);
};

//Get Search Coordinates
const getLocation = (e) => {
  weather.fadeOut();
  
  const tgt = $(e.target);
  console.log(tgt);
  console.log( 'searchEl val',searchEl.val() );
  const location =
    tgt[0].id === "searchBtn" ? searchEl.val() : tgt[0].textContent;
  console.log(location);
  const apiKey = config.GOOGLE_API;
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${location}&key=${apiKey}`;
  console.log(url);
  fetch(url).then((res) => {
    if (res.ok)
      res.json().then((data) => {
        const coord = data.results[0].geometry.location;
        searchHistory[location] = coord;
        localStorage.setItem("weatherHistory", JSON.stringify(searchHistory));
        if (tgt[0].id === "searchBtn") addToHistory(location);
        ui.width("1500");
        weather.fadeIn();
        getWeather(coord.lat, coord.lng, location);
      });
  });
};

//Get Weather from Coordinates
const getWeather = (lat, lon, loc) => {
  console.log(`getting weather for ${lat},${lon}`);
  let url = `https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&appid=${config.OW_API}&units=imperial`;
  console.log(url);
  fetch(url).then((res) => {
    if (res.ok)
      res.json().then((data) => {
        console.log({ data });
        // weather.show()
        // $('#ui-container').css({ 'justify-content': 'start' })
        
        
        // ui.width("375");
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
  // console.log(today);
  ui.css('opacity', 0.93)
  
  today.empty();
  console.log({ loc });
  body.attr({'opacity':0})

  let id = today.attr("id");
  const timezone = data.timezone;
  const current = id === "today" ? data.current : data;
  let currentDate = DateTime.fromSeconds(current.dt);
  let fullTime = currentDate.setZone(timezone);
  let time = currentDate.setZone(timezone).startOf("hour");
  console.log({ time });
  let date = currentDate.toLocaleString(DateTime.DATE_MED_WITH_WEEKDAY);
  let temp = current.temp.day;
  const sunrise = DateTime.fromSeconds(current.sunrise)
    .setZone(timezone)
    .startOf("hour");
  const sunset = DateTime.fromSeconds(current.sunset)
    .setZone(timezone)
    .startOf("hour");
  console.log(
    "sunrise,sunset,time",
    sunrise.hour,
    sunset.hour,
    time.hour
  );

  // today.addClass("container");

  // today.hide()
  //City Title
  const city = $("<h2>");
  let timeStr = ''
  if (id === "today") {
    // today.removeAttr('style')
    let weatherType;
    console.log(time.diff(sunrise,'hours').toObject().hours,'hours from sunrise')

    if (Math.abs(time.hour-sunrise.hour) == 0) {
      weatherType = "sunrise";
    } else if (Math.abs(sunset.hour - time.hour) == 0) {
      weatherType = "sunset";
    } else if (sunset.hour < time.hour || time.hour < sunrise.hour) {
      weatherType = "night";
    } else {
      weatherType = current.weather[0].main.toString().toLowerCase();
    }
    let bgSrc = background[weatherType];
    body.css({ "background": `url(${bgSrc}) center` ,'opacity':1});
    city.text(`${loc} -- `);
    temp = current.temp;
    let now = fullTime.toLocaleString(DateTime.TIME_SIMPLE);
    timeStr = `<h5> @ ${now}</h5>`;
  } else {
    date = date.substring(0, date.lastIndexOf(","));
  }
  
  console.log({ timeStr });
  city.append(`<i>${date}</i>${timeStr}`);
  // console.log(city.text())

  //Weather Icons
  const icon = current.weather[0].icon;
  const iconEl = $("<img>");
  const desc = current.weather[0].description;
  const descEl = $("<p>");
  descEl.html(`<i>${desc}</i>`);
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
  uvEl.html(`<b>UV Index:</b> `);
  const uvLevel = uvLevels[Math.min(Math.floor(uvIndex / 4), 2)];
  uviBtn.text(uvIndex).addClass(`btn btn-${uvLevel}`);

  uvEl.append(uviBtn);
  today.append(city);
  today.append(iconEl);
  today.append(descEl);
  today.append(tempEl);
  today.append(windEl);
  today.append(humidityEl);
  today.append(uvEl);
  
  
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
  let forecast = data.daily;
  forecast = forecast.splice(1, 5);
  console.log({ forecast });
  const forecastEl = $("#forecast");
  forecastEl.empty();
  forecastEl.addClass("container");
  console.log({ forecastEl });
  const forcastRow = $("<div>");
  forcastRow.addClass("row");
  console.log(forcastRow);
  forecastEl.append(forcastRow);
  forecast.forEach((day, i) => {
    // console.log(day);
    const forecastDayEl = $("<section>");

    forecastDayEl.addClass("col m-2 p-2");

    displayWeather(day, loc, forecastDayEl);
    forcastRow.append(forecastDayEl);
  });
};

//Initialize Site
createSearch();
