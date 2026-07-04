// ==========================
// WEATHER.JS
// ==========================

// Manual Weather Mode

let manualWeather = false;

// Manual Weather Update

export function updateManualWeather(data){

    if(data && data.weather){

        manualWeather = true;

        document.getElementById("weatherData").innerText =
        data.weather;

    }else{

        manualWeather = false;

    }

}

// Auto Weather

export async function fetchWeather(){

    if(manualWeather) return;

    try{

        const response = await fetch(
        "https://wttr.in/?format=j1"
        );

        const json = await response.json();

        const temp =
        json.current_condition[0].temp_C;

        const desc =
        json.current_condition[0]
        .weatherDesc[0].value;

        const humidity =
        json.current_condition[0].humidity;

        const wind =
        json.current_condition[0].windspeedKmph;

        document.getElementById("weatherData").innerHTML =

        `
        🌡 ${temp}°C

        <br>

        ☁ ${desc}

        <br>

        💧 Humidity : ${humidity}%

        <br>

        🌬 Wind : ${wind} km/h
        `;

    }catch(error){

        document.getElementById("weatherData").innerHTML =

        `
        Weather Not Available
        `;

    }

}

// Start Auto Weather

fetchWeather();

setInterval(fetchWeather,300000);
