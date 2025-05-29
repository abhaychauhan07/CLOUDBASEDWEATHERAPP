@echo off
echo Installing required libraries for Weather Forecast Application...
echo.

echo Step 1: Installing base libraries...
pip install numpy pandas flask requests python-dotenv plotly

echo.
echo Step 2: Installing Prophet dependencies...
pip install cmdstanpy

echo.
echo Step 3: Installing Prophet...
pip install prophet

echo.
echo Step 4: Installing scikit-learn...
pip install scikit-learn

echo.
echo Verifying installations...
python -c "import numpy; import pandas; import flask; import prophet; import plotly; import sklearn; print('All libraries installed successfully!')"

echo.
echo If you see no errors above, all libraries are installed correctly.
echo If you see any errors, please check the error message and refer to the troubleshooting guide.
pause 