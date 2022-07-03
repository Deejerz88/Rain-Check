const search = $("#search");
const today = $("#today");

let searchHistory = JSON.parse(localStorage.getItem("weatherHistory"));
searchHistory = !!searchHistory ? searchHistory : {};
console.log(searchHistory);

const showHistory = () => {
  console.log("showing hisotry");
  const searches = Object.keys(searchHistory);
  console.log(searches);

  const historyEl = $("<section>");
  historyEl.addClass("container");
  search.append(historyEl);

  searches.forEach((history) => {
    const historyBtn = $("<button/>");
    const rowContainer = $("<div>");
    rowContainer.addClass("row");
    historyBtn
      .text(history)
      .click(getLocation)
      .addClass("btn btn-info mb-3 col");
    rowContainer.append(historyBtn);
    historyEl.append(rowContainer);
  });
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
        getWeather(coord.lat, coord.lng, location);
      });
  });
};

const getWeather = (lat, lon, loc) => {
  console.log(`getting weather for ${lat},${lon}`);
  let url = `https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&appid=${config.OW_API}`;
  console.log(url);
  fetch(url).then((res) => {
    if (res.ok)
      res.json().then((data) => {
        console.log(data);
        displayCurrent(data, loc);
      });
  });
};

const displayCurrent = (data, loc) => {
  today.addClass("container");
  today.empty();

  const city = $("<h2>");
  city.text(loc);
  today.append(city);
};

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
  .addClass("btn btn-primary mb-3");
search.append(searchBtn);
showHistory();

const weather = $("#weather");
const searchEl = $("#search-input");
