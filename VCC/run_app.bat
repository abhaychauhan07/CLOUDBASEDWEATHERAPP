@echo off
echo Setting up Weather Application...

REM Check if virtual environment exists
if not exist venv (
    echo Creating virtual environment...
    python -m venv venv
)

REM Activate virtual environment
call venv\Scripts\activate.bat

REM Install requirements
echo Installing requirements...
pip install -r requirements.txt

REM Check if .env file exists
if not exist .env (
    echo Creating .env file...
    echo Please enter your OpenWeather API key:
    set /p API_KEY=
    echo OPENWEATHER_API_KEY=%API_KEY%> .env
)

REM Run the application
echo Starting the application...
python main.py

pause 