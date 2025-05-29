# Indian Weather Forecast Application

A cloud-based weather application that shows real-time weather data and forecasts for six major Indian cities using machine learning predictions.

## Quick Start

1. Make sure you have Python 3.8 or higher installed on your system
2. Double-click on `run_app.bat`
3. If this is your first time running the app, it will:
   - Create a virtual environment
   - Install all required dependencies
   - Ask for your OpenWeather API key (get one for free at https://openweathermap.org/api)
4. Open your browser and go to `http://localhost:5000`

## Features

- Real-time weather data for Dehradun, Jaipur, Mumbai, Kolkata, Chennai, and Delhi
- Dark/Light mode toggle
- Machine learning-based weather predictions
- Interactive weather visualizations
- Severe weather alerts
- Location recommendations based on weather conditions
- Responsive design for all devices

## Manual Setup (if one-click setup doesn't work)

1. Create a virtual environment:
   ```bash
   python -m venv venv
   ```

2. Activate the virtual environment:
   - Windows:
     ```bash
     venv\Scripts\activate
     ```
   - Linux/Mac:
     ```bash
     source venv/bin/activate
     ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Create a `.env` file in the root directory and add your OpenWeather API key:
   ```
   OPENWEATHER_API_KEY=your_api_key_here
   ```

5. Run the application:
   ```bash
   python main.py
   ```

## Project Structure

```
weather-app/
├── static/                # Static files
│   ├── css/
│   │   └── styles.css    # Application styles
│   └── js/
│       └── app.js        # Frontend JavaScript
├── templates/            # HTML templates
│   └── index.html       # Main application template
├── main.py              # Flask application
├── requirements.txt     # Project dependencies
├── .env                # Environment variables (API key)
├── README.md           # Documentation
└── run_app.bat        # One-click run script
```

## How It Works

1. Backend (`main.py`):
   - Handles all API routes
   - Processes weather data
   - Manages ML predictions
   - Provides recommendations

2. Frontend:
   - `templates/index.html`: Main application layout
   - `static/css/styles.css`: Styling with dark/light mode
   - `static/js/app.js`: Handles user interactions and data updates

3. Data Flow:
   - Frontend makes API calls to backend routes
   - Backend fetches data from OpenWeather API
   - ML model processes data for predictions
   - Results are displayed in real-time on the frontend

## Troubleshooting

1. If you see an error about missing modules, try running:
   ```bash
   pip install -r requirements.txt
   ```

2. If you get API errors, make sure your OpenWeather API key is correct in the `.env` file

3. If the application doesn't start:
   - Check if Python is installed and in your system PATH
   - Try running the commands from the Manual Setup section one by one

## Technologies Used

- Backend: Flask
- Frontend: HTML5, CSS3, JavaScript
- Data Visualization: Plotly
- Machine Learning: Prophet, scikit-learn
- Weather Data: OpenWeather API 