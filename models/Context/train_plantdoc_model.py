import os
import torch
import torch.nn as nn
from torch.utils.data import DataLoader
from torchvision import datasets, transforms, models
from torch.optim import Adam

# ===============================
# PATHS (update only if needed)
# ===============================
train_dir = "PlantDoc_Organized/train"
val_dir   = "PlantDoc_Organized/val"
num_classes = len(os.listdir(train_dir))  # auto detect classes
print(f"Detected Classes: {num_classes}")

# ===============================
# TRANSFORMS
# ===============================
transform_train = transforms.Compose([
    transforms.Resize((224,224)),
    transforms.RandomHorizontalFlip(),
    transforms.RandomRotation(10),
    transforms.RandomResizedCrop(224, scale=(0.8,1.0)),
    transforms.ToTensor(),
    transforms.Normalize([0.485,0.456,0.406],[0.229,0.224,0.225]),
])

transform_val = transforms.Compose([
    transforms.Resize((224,224)),
    transforms.ToTensor(),
    transforms.Normalize([0.485,0.456,0.406],[0.229,0.224,0.225]),
])

# ===============================
# DATA LOADERS
# ===============================
train_dataset = datasets.ImageFolder(train_dir, transform=transform_train)
val_dataset   = datasets.ImageFolder(val_dir, transform=transform_val)

train_loader = DataLoader(train_dataset, batch_size=16, shuffle=True)
val_loader   = DataLoader(val_dataset, batch_size=16)

print(f"Train Images: {len(train_dataset)}")
print(f"Val Images  : {len(val_dataset)}")

# ===============================
# MODEL — RESNET50 Transfer Learning
# ===============================
device = "cuda" if torch.cuda.is_available() else "cpu"
print("Training on:", device)

model = models.resnet50(weights="IMAGENET1K_V2")
for param in model.parameters():    # Freeze feature extractor
    param.requires_grad = False

model.fc = nn.Linear(model.fc.in_features, num_classes)  # new output layer
model = model.to(device)

criterion = nn.CrossEntropyLoss()
optimizer = Adam(model.fc.parameters(), lr=0.0008)

# ===============================
# TRAINING LOOP
# ===============================
epochs = 8   # increase to 12–20 later if results good

for epoch in range(epochs):
    model.train()
    total_loss = 0

    for images, labels in train_loader:
        images, labels = images.to(device), labels.to(device)

        optimizer.zero_grad()
        output = model(images)
        loss = criterion(output, labels)
        loss.backward()
        optimizer.step()
        total_loss += loss.item()

    ## Validation
    model.eval()
    correct = 0
    with torch.no_grad():
        for images, labels in val_loader:
            images, labels = images.to(device), labels.to(device)
            output = model(images)
            correct += (output.argmax(1) == labels).sum().item()

    acc = correct / len(val_dataset)
    print(f"Epoch {epoch+1}/{epochs}  Loss={total_loss:.4f}  Val Acc={acc:.4f}")

# ===============================
# SAVE MODEL
# ===============================
os.makedirs("exported_model", exist_ok=True)
torch.save(model.state_dict(), "exported_model/plantdoc_resnet50.pth")
print("\n🎉 Training Complete — Model Saved at exported_model/plantdoc_resnet50.pth")
