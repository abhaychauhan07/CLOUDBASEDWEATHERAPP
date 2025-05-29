from flask import Flask, render_template, jsonify, request
from dotenv import load_dotenv
import requests
import os
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from prophet import Prophet
from sklearn.metrics import mean_absolute_error
import json

# Load environment variables
load_dotenv()

app = Flask(__name__)

# Cities we're tracking
CITIES = {
    "Dehradun": {"lat": 30.3165, "lon": 78.0322},
    "Jaipur": {"lat": 26.9124, "lon": 75.7873},
    "Mumbai": {"lat": 19.0760, "lon": 72.8777},
    "Kolkata": {"lat": 22.5726, "lon": 88.3639},
    "Chennai": {"lat": 13.0827, "lon": 80.2707},
    "Delhi": {"lat": 28.6139, "lon": 77.2090}
}

API_KEY = "3d1a4a2e355a98f2b5cda790648e3e0a"

# Cache for storing historical data
WEATHER_CACHE = {}
CACHE_DURATION = timedelta(hours=1)

def get_historical_data(city, days=30):
    """Fetch historical weather data for training the ML model"""
    coords = CITIES[city]
    end_date = datetime.now()
    start_date = end_date - timedelta(days=days)
    
    # Check cache first
    cache_key = f"{city}_{start_date.date()}_{end_date.date()}"
    if cache_key in WEATHER_CACHE:
        cache_data, cache_time = WEATHER_CACHE[cache_key]
        if datetime.now() - cache_time < CACHE_DURATION:
            return cache_data

    historical_data = []
    current_date = start_date

    while current_date <= end_date:
        try:
            # Using daily aggregated data endpoint
            url = "https://api.openweathermap.org/data/2.5/weather"
            params = {
                "lat": coords["lat"],
                "lon": coords["lon"],
                "dt": int(current_date.timestamp()),
                "appid": API_KEY,
                "units": "metric"
            }
            
            response = requests.get(url, params=params)
            if response.status_code == 200:
                data = response.json()
                historical_data.append({
                    "ds": current_date,
                    "y": data["main"]["temp"],
                    "humidity": data["main"]["humidity"],
                    "pressure": data["main"]["pressure"],
                    "wind_speed": data["wind"]["speed"]
                })
        except Exception as e:
            print(f"Error fetching historical data: {e}")
        
        current_date += timedelta(days=1)
    
    # Cache the results
    WEATHER_CACHE[cache_key] = (historical_data, datetime.now())
    return historical_data

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/api/weather/<city>")
def get_weather(city):
    if city not in CITIES:
        return jsonify({"error": "City not found"}), 404
    
    coords = CITIES[city]
    url = "https://api.openweathermap.org/data/2.5/weather"
    params = {
        "lat": coords["lat"],
        "lon": coords["lon"],
        "appid": API_KEY,
        "units": "metric"
    }
    
    try:
        response = requests.get(url, params=params)
        response.raise_for_status()
        data = response.json()
        
        weather_data = {
            "temperature": data["main"]["temp"],
            "humidity": data["main"]["humidity"],
            "description": data["weather"][0]["description"],
            "wind_speed": data["wind"]["speed"],
            "wind_deg": data["wind"]["deg"],
            "pressure": data["main"]["pressure"],
            "visibility": data["visibility"],
            "clouds": data["clouds"]["all"],
            "timestamp": datetime.utcfromtimestamp(data["dt"]).isoformat()
        }
        return jsonify(weather_data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/forecast/<city>")
def get_forecast(city):
    if city not in CITIES:
        return jsonify({"error": "City not found"}), 404
    
    coords = CITIES[city]
    url = "https://api.openweathermap.org/data/2.5/forecast"
    params = {
        "lat": coords["lat"],
        "lon": coords["lon"],
        "appid": API_KEY,
        "units": "metric"
    }
    
    try:
        response = requests.get(url, params=params)
        response.raise_for_status()
        data = response.json()
        
        forecast_data = []
        for item in data["list"]:
            forecast_data.append({
                "temperature": item["main"]["temp"],
                "humidity": item["main"]["humidity"],
                "description": item["weather"][0]["description"],
                "timestamp": item["dt_txt"]
            })
        return jsonify(forecast_data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/predictions/<city>")
def get_predictions(city):
    if city not in CITIES:
        return jsonify({"error": "City not found"}), 404
    
    try:
        # Get historical data for training
        historical_data = get_historical_data(city)
        if not historical_data:
            return jsonify({"error": "Insufficient historical data"}), 500

        # Prepare data for Prophet
        df = pd.DataFrame(historical_data)
        
        # Add additional features
        df['month'] = df['ds'].dt.month
        df['day_of_week'] = df['ds'].dt.dayofweek
        
        # Create and configure Prophet model with additional parameters
        model = Prophet(
            daily_seasonality="auto",
            weekly_seasonality="auto",
            yearly_seasonality="auto",
            changepoint_prior_scale=0.05,
            seasonality_prior_scale=10.0
        )
        
        # Add custom seasonalities
        model.add_seasonality(
            name='monthly',
            period=30.5,
            fourier_order=5
        )
        
        # Add additional regressors
        if 'humidity' in df.columns:
            model.add_regressor('humidity')
        if 'pressure' in df.columns:
            model.add_regressor('pressure')
        if 'wind_speed' in df.columns:
            model.add_regressor('wind_speed')
        
        # Fit the model
        model.fit(df)
        
        # Create future dataframe for predictions
        future_dates = model.make_future_dataframe(periods=7)  # 7 days forecast
        
        # Add regressor values for future dates (using last known values)
        if 'humidity' in df.columns:
            future_dates['humidity'] = df['humidity'].mean()
        if 'pressure' in df.columns:
            future_dates['pressure'] = df['pressure'].mean()
        if 'wind_speed' in df.columns:
            future_dates['wind_speed'] = df['wind_speed'].mean()
        
        # Make predictions
        forecast = model.predict(future_dates)
        
        # Calculate confidence scores based on historical accuracy
        historical_predictions = forecast[forecast['ds'].isin(df['ds'])]
        mae = mean_absolute_error(df['y'], historical_predictions['yhat'])
        confidence_score = max(0.0, min(100.0, 100.0 * (1.0 - float(mae)/10.0)))  # Scale MAE to confidence percentage
        
        # Prepare prediction results
        predictions = []
        for _, row in forecast.tail(7).iterrows():
            predictions.append({
                "date": row["ds"].strftime("%Y-%m-%d"),
                "temperature": round(row["yhat"], 1),
                "temperature_lower": round(row["yhat_lower"], 1),
                "temperature_upper": round(row["yhat_upper"], 1),
                "trend": row["trend"],
                "confidence_score": round(confidence_score, 1)
            })
        
        return jsonify({
            "predictions": predictions,
            "model_info": {
                "confidence_score": round(confidence_score, 1),
                "mean_absolute_error": round(float(mae), 2),
                "training_days": len(df)
            }
        })
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/recommendations")
def get_recommendations():
    recommendations = []
    
    for city, coords in CITIES.items():
        try:
            url = "https://api.openweathermap.org/data/2.5/weather"
            params = {
                "lat": coords["lat"],
                "lon": coords["lon"],
                "appid": API_KEY,
                "units": "metric"
            }
            
            response = requests.get(url, params=params)
            response.raise_for_status()
            data = response.json()
            
            temp = data["main"]["temp"]
            weather = data["weather"][0]["main"].lower()
            
            # Simple recommendation logic
            score = 0
            if 20 <= temp <= 30:
                score += 3
            elif 15 <= temp <= 35:
                score += 2
            
            if weather in ["clear", "clouds"]:
                score += 2
            elif weather not in ["rain", "storm", "snow"]:
                score += 1
            
            recommendations.append({
                "city": city,
                "score": score,
                "reason": f"Current temperature: {temp}°C, Weather: {weather}"
            })
        
        except Exception:
            continue
    
    # Sort by score descending
    recommendations.sort(key=lambda x: x["score"], reverse=True)
    return jsonify(recommendations)

if __name__ == "__main__":
    app.run(debug=True)