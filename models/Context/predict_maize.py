import torch
from torchvision import transforms
from PIL import Image

# ----------------- Load model (full model saved earlier) -----------------
model = torch.load("exported_model/maize_resnet50.pth", map_location="cpu", weights_only=False)
model.eval()

# ----------------- Class labels -----------------
classes = ['fall army worm','healthy','herbicide burn','magnesium deficiency',
           'maize streak','multiple','nitrogen deficiency','potassium deficiency',
           'stalk borer','sulphur deficiency','zinc deficiency']

# ----------------- Transform -----------------
transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize([0.485,0.456,0.406],[0.229,0.224,0.225])
])

# ----------------- Predict Function -----------------
def predict(img_path):
    img = Image.open(img_path).convert("RGB")
    img = transform(img).unsqueeze(0)

    with torch.no_grad():
        output = model(img)
        pred = output.argmax(1).item()

    print(f"\n🌽 Predicted: {classes[pred]}\n")

# Change filename here
predict(r"download (2).jfif")
