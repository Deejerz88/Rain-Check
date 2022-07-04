const search = $("#search");
const today = $("#today");
const DateTime = luxon.DateTime;

let searchHistory = JSON.parse(localStorage.getItem("weatherHistory"));
searchHistory = !!searchHistory ? searchHistory : {};
console.log(searchHistory);

const historyEl = $("<section>");

const showHistory = () => {
  console.log("showing hisotry");
  const searches = Object.keys(searchHistory);
  console.log(searches);

  historyEl.addClass("container");
  search.append(historyEl);

  searches.forEach((history) => {
    addToHistory(history);
  });
};

const addToHistory = (history) => {
  const historyBtn = $("<button/>");
  const rowContainer = $("<div>");
  rowContainer.addClass("row");
  historyBtn.text(history).click(getLocation).addClass("btn btn-info mb-3 col");
  rowContainer.append(historyBtn);
  historyEl.append(rowContainer);
};

const getLocation = (e) => {
  const tgt = $(e.target);
  console.log(tgt);
  const location =
    tgt[0].id === "searchBtn" ? searchEl.val().trim() : tgt[0].textContent;
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
        getWeather(coord.lat, coord.lng, location);
      });
  });
};

const getWeather = (lat, lon, loc) => {
  console.log(`getting weather for ${lat},${lon}`);
  let url = `https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&appid=${config.OW_API}&units=imperial`;
  console.log(url);
  fetch(url).then((res) => {
    if (res.ok)
      res.json().then((data) => {
        console.log({ data });
        displayWeather(data, loc, today);
      });
  });
};

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

const displayWeather = (data, loc, today) => {
  // console.log(today);
  const id = today.attr('id')
  const current = id === "today" ? data.current : data;

  // today.addClass("container");
  today.empty();

  //City Title
  const city = $("<h2>");
  const date = DateTime.fromSeconds(current.dt).toLocaleString(
    DateTime.DATE_MED_WITH_WEEKDAY
  );
  if (id === 'today') { city.text(`${loc} -- `) }
  city.append(`<i>${date}</id>`)
  // console.log(city.text())
  today.append(city)
  
  //temperature
  const tempEl = $("<p>");
  const temp = id === 'today' ? current.temp:current.temp.day
  const feelsLike = id === 'today' ? current.feels_like:current.feels_like.day
  tempEl.html(
    `<b>Temperature:</b> ${temp}&deg;F -- <i>Feels Like: ${feelsLike}&deg;F</i>`
  );
  today.append(tempEl);

  //wind
  const windEl = $("<p>");
  const windSpeed = current.wind_speed;
  const windGust = current.wind_gust;
  const windDeg = current.wind_deg;

  const windDir = degToCompass(windDeg);

  let sep = id === 'today' ? ' | ':'<br>--'

  windEl.html(
    `<b>Wind Speed:</b> ${windSpeed} MPH${sep}<b>Direction:</b> ${windDir}${sep}<b>Wind Gust:</b> ${windGust}`
  );
  today.append(windEl);

  //humidity
  const humidityEl = $("<p>");
  const humidity = current.humidity;
  humidityEl.html(`<b>Humidity:</b> ${humidity}%`);
  today.append(humidityEl);

  //UV Index
  const uvEl = $("<p>");
  const uvIndex = current.uvi;
  const uviBtn = $("<button>");
  const uvLevels = ["success", "warning", "danger"];
  uvEl.html(`<b>UV Index:</b> `);
  const uvLevel = uvLevels[Math.floor(uvIndex / 4)];
  uviBtn.text(uvIndex).addClass(`btn btn-${uvLevel}`);

  uvEl.append(uviBtn);
  today.append(uvEl);

  if (today.attr("id") === "today") displayForecast(data, loc);
};

const displayForecast = (data, loc) => {
  let forecast = data.daily;
  forecast = forecast.splice(1,5)
  console.log({forecast});
  const forecastEl = $("#forecast");
  forecastEl.empty()
  forecastEl.addClass("container");
  console.log(forecastEl)
  const dayEl = $("<div>");
  dayEl.addClass("row");
  console.log(dayEl)
  forecastEl.append(dayEl);
  forecast.forEach((day, i) => {
    // console.log(day);
    const forecastDayEl = $("<section>");

    forecastDayEl.addClass("col");
    displayWeather(day, loc, forecastDayEl);
    // console.log(forecastDayEl);
    dayEl.append(forecastDayEl);
    // console.log(dayEl.html())
  });
  console.log(forecastEl)
  
};

const createSearch = () => {
  search.addClass("p-3");
  const searchInput = $("<input/>");
  searchInput
    .attr({ id: "search-input", placeholder: "Search City", type: "text" })
    .addClass("form-control mb-3");
  const searchLabel = $("<label/>");
  searchLabel.attr("for", "search-input").text("Search City").addClass("m-3");
  search.append(searchInput).append(searchLabel);

  const searchBtn = $("<button/>");
  searchBtn
    .text("Get Weather")
    .click(getLocation)
    .attr("id", "searchBtn")
    .addClass("btn btn-primary mb-3 align-self-end");
  search.append(searchBtn);
  showHistory();
};

createSearch();
const weather = $("#weather");
const searchEl = $("#search-input");
