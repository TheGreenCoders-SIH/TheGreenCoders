import torch
import torch.nn as nn
import torch.optim as optim
from torchvision import datasets, models, transforms
from torch.utils.data import DataLoader
import os

# ============================== PATHS ==============================
train_dir = r"C:\Users\admin\Desktop\Models\Rice_Organized\train"
val_dir   = r"C:\Users\admin\Desktop\Models\Rice_Organized\val"
save_path = r"exported_model/rice_resnet50.pth"

os.makedirs("exported_model", exist_ok=True)

# ========================== DATA AUGMENTATION ======================
train_transform = transforms.Compose([
    transforms.Resize((256,256)),
    transforms.RandomHorizontalFlip(),
    transforms.RandomVerticalFlip(),
    transforms.RandomRotation(20),
    transforms.ColorJitter(brightness=0.3, contrast=0.3, saturation=0.3),
    transforms.ToTensor(),
])

val_transform = transforms.Compose([
    transforms.Resize((256,256)),
    transforms.ToTensor(),
])

# ============================= LOAD DATA ============================
train_data = datasets.ImageFolder(train_dir, transform=train_transform)
val_data   = datasets.ImageFolder(val_dir, transform=val_transform)

train_loader = DataLoader(train_data, batch_size=16, shuffle=True)   # slower PC friendly
val_loader   = DataLoader(val_data, batch_size=16, shuffle=False)

num_classes = len(train_data.classes)
print("\nClasses Detected:", train_data.classes)
print("Train Images:", len(train_data))
print("Val Images  :", len(val_data))

# ============================= MODEL ================================
from torchvision.models import ResNet50_Weights

model = models.resnet50(weights=ResNet50_Weights.DEFAULT)
model.fc = nn.Linear(model.fc.in_features, num_classes)

device = "cuda" if torch.cuda.is_available() else "cpu"
model.to(device)

criterion = nn.CrossEntropyLoss()
optimizer = optim.Adam(model.parameters(), lr=0.0008) 

# ========================== TRAINING LOOP ===========================
epochs = 10
best_acc = 0

print(f"\nTraining on: {device}\n")

for epoch in range(1, epochs+1):
    model.train()
    running_loss = 0

    for imgs, labels in train_loader:
        imgs, labels = imgs.to(device), labels.to(device)

        optimizer.zero_grad()
        outputs = model(imgs)
        loss = criterion(outputs, labels)
        loss.backward()
        optimizer.step()
        running_loss += loss.item()

    # ------------------ VALIDATION ------------------
    model.eval()
    correct = 0
    total = 0

    with torch.no_grad():
        for imgs, labels in val_loader:
            imgs, labels = imgs.to(device), labels.to(device)
            outputs = model(imgs)
            _, predicted = outputs.max(1)
            total += labels.size(0)
            correct += (predicted == labels).sum().item()

    val_acc = correct / total
    print(f"Epoch {epoch}/{epochs} | Loss={running_loss:.2f} | Val Acc={val_acc:.4f}")

    # save best model
    if val_acc > best_acc:
        best_acc = val_acc
        torch.save(model.state_dict(), save_path)
        print(f"💾 Model Updated & Saved (Best Acc={best_acc:.4f})")

print(f"\n🎉 Training Completed — Best Accuracy: {best_acc:.4f}")
print(f"📁 Model saved at: {save_path}")
