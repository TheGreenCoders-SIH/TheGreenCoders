import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
import joblib
import requests


# -----------------------------
# TRAINING
# -----------------------------

file_path = r"C:/Users/admin/Desktop/Models/Crop_recommendation.csv"
df = pd.read_csv(file_path)

X = df.drop("label", axis=1)
y = df["label"]

print("\nINPUT ORDER:")
print(list(X.columns))
print("----------------------------\n")

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

model = RandomForestClassifier(n_estimators=200, random_state=42)
model.fit(X_train, y_train)

y_pred = model.predict(X_test)

print("\nMODEL PERFORMANCE")
print("Accuracy:", accuracy_score(y_test, y_pred))
print("\nClassification Report:")
print(classification_report(y_test, y_pred))
print("\nConfusion Matrix:")
print(confusion_matrix(y_test, y_pred))

model_path = r"C:/Users/admin/Desktop/Models/crop_model.pkl"
joblib.dump(model, model_path)
print(f"\nModel saved at: {model_path}")


# -----------------------------
# WEATHER FETCH FUNCTION (OPEN-METEO)
# -----------------------------

def get_weather(lat, lon):
    try:
        url = (
            f"https://api.open-meteo.com/v1/forecast?"
            f"latitude={lat}&longitude={lon}"
            f"&hourly=temperature_2m,relativehumidity_2m,precipitation"
            f"&forecast_days=1"
        )

        data = requests.get(url, timeout=10).json()

        temperature = data["hourly"]["temperature_2m"][0]
        humidity = data["hourly"]["relativehumidity_2m"][0]
        rainfall = data["hourly"]["precipitation"][0]

        return temperature, humidity, rainfall

    except:
        print("Weather API failed. Enter values manually.")
        temperature = float(input("Temperature: "))
        humidity = float(input("Humidity: "))
        rainfall = float(input("Rainfall: "))
        return temperature, humidity, rainfall


# -----------------------------
# TESTING / PREDICTION
# -----------------------------

print("\nTEST THE MODEL")

N = float(input("Enter Nitrogen (N): "))
P = float(input("Enter Phosphorus (P): "))
K = float(input("Enter Potassium (K): "))
ph = float(input("Enter pH: "))

lat = float(input("Enter Latitude: "))
lon = float(input("Enter Longitude: "))

temperature, humidity, rainfall = get_weather(lat, lon)

print("\nFetched Weather:")
print("Temperature:", temperature)
print("Humidity:", humidity)
print("Rainfall:", rainfall)

input_df = pd.DataFrame([{
    "N": N,
    "P": P,
    "K": K,
    "temperature": temperature,
    "humidity": humidity,
    "ph": ph,
    "rainfall": rainfall
}])

prediction = model.predict(input_df)[0]
confidence = model.predict_proba(input_df)[0].max()

print("\nRESULT")
print("Predicted Crop:", prediction)
print("Confidence:", confidence * 100, "%")
print("----------------------------")
