import torch
from torchvision import transforms, models
from PIL import Image

# ----------------------------
# Load Model
# ----------------------------
model_path = "exported_model/plantdoc_resnet50_finetuned.pth"
device = torch.device("cpu")

model = models.resnet50(weights=None)
model.fc = torch.nn.Linear(model.fc.in_features, 29)
model.load_state_dict(torch.load(model_path, map_location=device))
model.eval()

# ----------------------------
# Class Labels (29)
# ----------------------------
classes = [
"Apple Scab Leaf","Apple leaf","Apple rust leaf","Bell_pepper leaf","Bell_pepper leaf spot",
"Blueberry leaf","Cherry leaf","Corn Gray leaf spot","Corn leaf blight","Corn rust leaf",
"grape leaf","grape leaf black rot","Peach leaf","Potato leaf","Potato leaf early blight",
"Potato leaf late blight","Raspberry leaf","Soyabean leaf","Soybean leaf",
"Squash Powdery mildew leaf","Strawberry leaf","Tomato Early blight leaf","Tomato leaf",
"Tomato leaf bacterial spot","Tomato leaf late blight","Tomato leaf mosaic virus",
"Tomato leaf yellow virus","Tomato mold leaf","Tomato Septoria leaf spot",
"Tomato two spotted spider mites leaf"
]

# ----------------------------
# Image Transform
# ----------------------------
transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize([0.485,0.456,0.406],[0.229,0.224,0.225])
])

def predict(image_path):
    img = Image.open(image_path).convert("RGB")
    img = transform(img).unsqueeze(0)

    with torch.no_grad():
        output = model(img)
        _, pred = torch.max(output, 1)

    print(f"\nPredicted Class: {classes[pred.item()]}\n")

# ----------------------------
# RUN TEST
# ----------------------------

predict(r"download (2).jfif")   # <-- use your file name here
