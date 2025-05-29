document.addEventListener('DOMContentLoaded', () => {
    const citySelect = document.getElementById('citySelect');
    const themeToggle = document.getElementById('themeToggle');
    const alertBanner = document.getElementById('alertBanner');
    const closeAlert = document.querySelector('.close-alert');
    
    // Theme toggle functionality
    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        localStorage.setItem('theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
        // Update charts with new theme colors
        updateData();
    });

    // Load saved theme
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-mode');
    }

    // Close alert banner
    closeAlert.addEventListener('click', () => {
        alertBanner.classList.add('hidden');
    });

    // Show weather alert
    function showAlert(message) {
        const alertMessage = document.querySelector('.alert-message');
        alertMessage.textContent = message;
        alertBanner.classList.remove('hidden');
    }

    // Get theme-based colors
    function getThemeColors() {
        return {
            primary: getComputedStyle(document.body).getPropertyValue('--primary-color'),
            text: getComputedStyle(document.body).getPropertyValue('--text-color'),
            background: getComputedStyle(document.body).getPropertyValue('--background-color'),
            border: getComputedStyle(document.body).getPropertyValue('--border-color')
        };
    }

    // Fetch current weather and create gauge charts
    function getWeatherEmoji(description) {
        const weatherMap = {
            'clear sky': '☀️',
            'few clouds': '🌤️',
            'scattered clouds': '⛅',
            'broken clouds': '☁️',
            'shower rain': '🌦️',
            'rain': '🌧️',
            'thunderstorm': '⛈️',
            'snow': '🌨️',
            'mist': '🌫️',
            'haze': '🌫️',
            'fog': '🌫️',
            'smoke': '🌫️',
            'dust': '💨',
            'sand': '💨',
            'drizzle': '🌧️'
        };
        const lowercaseDesc = description.toLowerCase();
        return weatherMap[lowercaseDesc] || '🌡️';
    }

    function getWindDirection(degrees) {
        const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
        const index = Math.round(degrees / 22.5) % 16;
        return directions[index];
    }

    function getWindEmoji(speed) {
        if (speed < 1) return '🌫️';
        if (speed < 5) return '🌬️';
        if (speed < 10) return '💨';
        return '🌪️';
    }

    async function fetchCurrentWeather(city) {
        try {
            const response = await fetch(`/api/weather/${city}`);
            const data = await response.json();
            
            const weatherInfo = document.querySelector('.weather-info');
            weatherInfo.innerHTML = `
                <div class="weather-main">
                    <div class="weather-icon-large">${getWeatherEmoji(data.description)}</div>
                    <p class="temperature">${Math.round(data.temperature)}°C</p>
                    <p class="description">${data.description}</p>
                </div>
                <div class="weather-details-grid">
                    <div class="weather-detail-item">
                        <span class="detail-icon">💧</span>
                        <div class="detail-info">
                            <span class="detail-label">Humidity</span>
                            <span class="detail-value">${Math.round(data.humidity)}%</span>
                        </div>
                    </div>
                    <div class="weather-detail-item">
                        <span class="detail-icon">${getWindEmoji(data.wind_speed)}</span>
                        <div class="detail-info">
                            <span class="detail-label">Wind Speed</span>
                            <span class="detail-value">${data.wind_speed.toFixed(1)} m/s</span>
                        </div>
                    </div>
                    <div class="weather-detail-item">
                        <span class="detail-icon">🧭</span>
                        <div class="detail-info">
                            <span class="detail-label">Wind Direction</span>
                            <span class="detail-value">${getWindDirection(data.wind_deg)} (${data.wind_deg}°)</span>
                        </div>
                    </div>
                    <div class="weather-detail-item">
                        <span class="detail-icon">👁️</span>
                        <div class="detail-info">
                            <span class="detail-label">Visibility</span>
                            <span class="detail-value">${(data.visibility / 1000).toFixed(1)} km</span>
                        </div>
                    </div>
                    <div class="weather-detail-item">
                        <span class="detail-icon">⏱️</span>
                        <div class="detail-info">
                            <span class="detail-label">Pressure</span>
                            <span class="detail-value">${data.pressure} hPa</span>
                        </div>
                    </div>
                    <div class="weather-detail-item">
                        <span class="detail-icon">☁️</span>
                        <div class="detail-info">
                            <span class="detail-label">Cloudiness</span>
                            <span class="detail-value">${data.clouds}%</span>
                        </div>
                    </div>
                </div>
                <div id="humidityGauge" class="gauge-chart"></div>
                <div id="windGauge" class="gauge-chart"></div>
            `;
    
            // Create humidity gauge with improved readability
            const humidityGauge = {
                type: "indicator",
                mode: "gauge+number",
                value: Math.round(data.humidity),
                title: { 
                    text: "Humidity %",
                    font: { size: 16, color: getThemeColors().text }
                },
                gauge: {
                    axis: { 
                        range: [0, 100],
                        tickwidth: 1,
                        tickcolor: getThemeColors().text
                    },
                    bar: { color: getThemeColors().primary },
                    bgcolor: getThemeColors().background,
                    borderwidth: 2,
                    bordercolor: getThemeColors().border,
                    steps: [
                        { range: [0, 30], color: "#B4E1FF" },
                        { range: [30, 70], color: "#82CFFF" },
                        { range: [70, 100], color: "#1E90FF" }
                    ],
                    threshold: {
                        line: { color: "red", width: 4 },
                        thickness: 0.75,
                        value: 80
                    }
                },
                number: {
                    font: { color: getThemeColors().text }
                }
            };
    
            // Create wind speed gauge with improved readability
            const windGauge = {
                type: "indicator",
                mode: "gauge+number",
                value: parseFloat(data.wind_speed.toFixed(1)),
                title: { 
                    text: "Wind Speed (m/s)",
                    font: { size: 16, color: getThemeColors().text }
                },
                gauge: {
                    axis: { 
                        range: [0, 20],
                        tickwidth: 1,
                        tickcolor: getThemeColors().text,
                        tickmode: 'linear',
                        dtick: 5
                    },
                    bar: { color: getThemeColors().primary },
                    bgcolor: getThemeColors().background,
                    borderwidth: 2,
                    bordercolor: getThemeColors().border,
                    steps: [
                        { range: [0, 5], color: "#B4FFB4" },
                        { range: [5, 10], color: "#82FF82" },
                        { range: [10, 20], color: "#1E901E" }
                    ],
                    threshold: {
                        line: { color: "red", width: 4 },
                        thickness: 0.75,
                        value: 15
                    }
                },
                number: {
                    font: { color: getThemeColors().text },
                    suffix: " m/s"
                }
            };
    
            const gaugeLayout = {
                width: 200,
                height: 150,
                paper_bgcolor: 'transparent',
                font: { color: getThemeColors().text },
                margin: { t: 25, b: 25, l: 25, r: 25 }
            };
    
            Plotly.newPlot('humidityGauge', [humidityGauge], gaugeLayout);
            Plotly.newPlot('windGauge', [windGauge], gaugeLayout);
        } catch (error) {
            console.error('Error fetching current weather:', error);
            weatherInfo.innerHTML = '<p class="error-message">Unable to load weather data</p>';
        }
    }

    // Fetch and display forecast with enhanced visualization
    async function fetchForecast(city) {
        try {
            const response = await fetch(`/api/forecast/${city}`);
            const data = await response.json();

            // Process data to show only one reading per day with Indian timezone
            const dailyData = data.reduce((acc, item) => {
                // Convert to Indian time (UTC+5:30)
                const date = new Date(item.timestamp);
                date.setHours(date.getHours() + 5);
                date.setMinutes(date.getMinutes() + 30);
                const dateStr = date.toLocaleDateString('en-IN', {
                    timeZone: 'Asia/Kolkata',
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                });

                if (!acc[dateStr]) {
                    acc[dateStr] = {
                        temp: item.temperature,
                        humidity: item.humidity,
                        count: 1,
                        date: date
                    };
                } else {
                    acc[dateStr].temp += item.temperature;
                    acc[dateStr].humidity += item.humidity;
                    acc[dateStr].count++;
                }
                return acc;
            }, {});

            // Calculate averages and prepare data for plotting
            const dates = Object.keys(dailyData);
            const temperatures = dates.map(date => Math.round(dailyData[date].temp / dailyData[date].count));

            const traces = [{
                x: dates,
                y: temperatures,
                type: 'bar',
                name: 'Temperature (°C)',
                marker: {
                    color: getThemeColors().primary,
                    opacity: 0.8
                },
                text: temperatures.map(temp => `${temp}°C`),
                textposition: 'auto',
                hovertemplate: '%{x}<br>Temperature: %{y}°C<extra></extra>'
            }];

            const layout = {
                title: {
                    text: '5-Day Weather Forecast (IST)',
                    font: { size: 20 }
                },
                paper_bgcolor: 'transparent',
                plot_bgcolor: 'transparent',
                font: {
                    color: getThemeColors().text
                },
                xaxis: {
                    gridcolor: getThemeColors().border,
                    title: 'Date',
                    tickangle: -45,
                    tickformat: '%d %b %Y',  // Indian date format
                    tickmode: 'array',
                    ticktext: dates.map(date => {
                        const d = new Date(dailyData[date].date);
                        return d.toLocaleDateString('en-IN', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short'
                        });
                    }),
                    tickvals: dates
                },
                yaxis: {
                    gridcolor: getThemeColors().border,
                    title: 'Temperature (°C)',
                    titlefont: { color: getThemeColors().primary },
                    tickfont: { color: getThemeColors().primary },
                    zeroline: false
                },
                showlegend: false,
                margin: {
                    t: 40,
                    r: 20,
                    b: 60,
                    l: 50
                },
                bargap: 0.3
            };

            Plotly.newPlot('forecastChart', traces, layout);
        } catch (error) {
            console.error('Error fetching forecast:', error);
            document.getElementById('forecastChart').innerHTML = '<p class="error-message">Unable to load forecast data</p>';
        }
    }

    // Fetch and display ML predictions with enhanced visualization
    async function fetchPredictions(city) {
        try {
            // Show loading state
            const predictionChart = document.getElementById('predictionsChart');
            predictionChart.innerHTML = '<div class="loading-spinner">Loading predictions...</div>';
    
            const response = await fetch(`/api/predictions/${city}`);
            const data = await response.json();
    
            // Process data more efficiently
            const predictions = data.predictions;
            const traces = [
                {
                    x: predictions.map(item => {
                        const date = new Date(item.date);
                        return date.toLocaleDateString('en-IN', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short'
                        });
                    }),
                    y: predictions.map(item => Math.round(item.temperature)),
                    type: 'scatter',
                    mode: 'lines+markers',
                    name: 'Predicted Temperature',
                    line: {
                        color: '#2196F3',
                        width: 3
                    },
                    marker: {
                        size: 8,
                        color: '#2196F3'
                    },
                    hovertemplate: '<b>%{x}</b><br>Temperature: %{y}°C<extra></extra>'
                }
            ];
    
            // Add confidence interval if available
            if (predictions[0].temperature_upper && predictions[0].temperature_lower) {
                traces.push({
                    x: predictions.map(item => {
                        const date = new Date(item.date);
                        return date.toLocaleDateString('en-IN', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short'
                        });
                    }).concat(predictions.map(item => {
                        const date = new Date(item.date);
                        return date.toLocaleDateString('en-IN', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short'
                        });
                    }).reverse()),
                    y: predictions.map(item => Math.round(item.temperature_upper))
                        .concat(predictions.map(item => Math.round(item.temperature_lower)).reverse()),
                    fill: 'toself',
                    fillcolor: 'rgba(33, 150, 243, 0.2)',
                    line: { color: 'transparent' },
                    name: 'Prediction Interval',
                    showlegend: true,
                    hoverinfo: 'skip'
                });
            }
    
            const layout = {
                title: {
                    text: 'Temperature Predictions',
                    font: { 
                        size: 24,
                        color: getThemeColors().text,
                        weight: 'bold'
                    }
                },
                paper_bgcolor: 'transparent',
                plot_bgcolor: 'transparent',
                font: {
                    family: 'Arial, sans-serif',
                    color: getThemeColors().text,
                    size: 14
                },
                xaxis: {
                    gridcolor: getThemeColors().border,
                    title: {
                        text: 'Date',
                        font: {
                            size: 16,
                            color: getThemeColors().text
                        }
                    },
                    tickangle: -45,
                    tickfont: {
                        size: 12
                    },
                    showgrid: true
                },
                yaxis: {
                    gridcolor: getThemeColors().border,
                    title: {
                        text: 'Temperature (°C)',
                        font: {
                            size: 16,
                            color: getThemeColors().text
                        }
                    },
                    tickfont: {
                        size: 12
                    },
                    showgrid: true
                },
                showlegend: true,
                legend: {
                    x: 0.5,
                    y: 1.2,
                    xanchor: 'center',
                    orientation: 'h',
                    font: {
                        size: 14
                    }
                },
                margin: { t: 50, r: 30, b: 80, l: 60 },
                hovermode: 'closest',
                annotations: [{
                    xref: 'paper',
                    yref: 'paper',
                    x: 0,
                    xanchor: 'left',
                    y: -0.4,
                    yanchor: 'bottom',
                    text: `Model Accuracy: ${data.accuracy}%<br>Error Margin: ±${data.error_margin}°C`,
                    showarrow: false,
                    font: {
                        size: 14,
                        color: getThemeColors().text
                    }
                }]
            };
    
            const config = {
                responsive: true,
                displayModeBar: false,
                staticPlot: false
            };
    
            Plotly.newPlot('predictionsChart', traces, layout, config);
        } catch (error) {
            console.error('Error fetching predictions:', error);
            document.getElementById('predictionsChart').innerHTML = 
                '<p class="error-message">Unable to load prediction data</p>';
        }
    }

    // Fetch and display recommendations
    async function fetchRecommendations() {
        try {
            const response = await fetch('/api/recommendations');
            const data = await response.json();

            const recommendationsList = document.querySelector('.recommendations-list');
            if (!data || data.length === 0) {
                recommendationsList.innerHTML = '<li class="no-recommendations">No travel recommendations available at the moment.</li>';
                return;
            }

            recommendationsList.innerHTML = data.map(item => `
                <li class="recommendation-item">
                    <div class="recommendation-header">
                        <span class="city-name">${item.city}</span>
                        <span class="weather-icon">🌤️</span>
                    </div>
                    <div class="recommendation-body">
                        ${item.reason}
                    </div>
                    <div class="recommendation-footer">
                        <span class="temp-range">${item.temperature}°C</span>
                        <span class="humidity">${item.humidity}% Humidity</span>
                    </div>
                </li>
            `).join('');
        } catch (error) {
            console.error('Error fetching recommendations:', error);
            const recommendationsList = document.querySelector('.recommendations-list');
            recommendationsList.innerHTML = '<li class="error-message">Unable to load recommendations. Please try again later.</li>';
        }
    }

    // Update all data when city changes
    function updateData() {
        const selectedCity = citySelect.value;
        fetchCurrentWeather(selectedCity);
        fetchForecast(selectedCity);
        fetchPredictions(selectedCity);
        fetchRecommendations();
    }

    // Initial data load
    updateData();

    // Update data when city changes
    citySelect.addEventListener('change', updateData);

    // Update data every 5 minutes
    setInterval(updateData, 5 * 60 * 1000);
});
