import torch
from torchvision import models, transforms
from PIL import Image
import os

model_path = r"exported_model/rice_resnet50.pth"

# class order must match folder names
classes = [
    'bacterial_leaf_blight',
    'bacterial_leaf_streak',
    'bacterial_panicle_blight',
    'blast',
    'brown_spot',
    'dead_heart',
    'downy_mildew',
    'hispa',
    'normal',
    'tungro'
]

# ----------------- Load Model -----------------
from torchvision.models import ResNet50_Weights
model = models.resnet50(weights=ResNet50_Weights.DEFAULT)
model.fc = torch.nn.Linear(model.fc.in_features, len(classes))
model.load_state_dict(torch.load(model_path, map_location="cpu"))
model.eval()

# ----------------- Transform ------------------
transform = transforms.Compose([
    transforms.Resize((256,256)),
    transforms.ToTensor(),
])

# ----------------- Predict Function -----------
def predict(image_path):
    img = Image.open(image_path).convert("RGB")
    img = transform(img).unsqueeze(0)

    with torch.no_grad():
        outputs = model(img)
        _, predicted = outputs.max(1)
        return classes[predicted.item()]

# test
image = "100661.jpg"   # put rice image path here
print("Predicted:", predict(image))
