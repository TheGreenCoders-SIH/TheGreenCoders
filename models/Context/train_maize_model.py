import torch
import torch.nn as nn
from torchvision import datasets, transforms
from torchvision.models import resnet50, ResNet50_Weights
from torch.utils.data import DataLoader

train_dir = "Maize_Organized/train"
val_dir   = "Maize_Organized/val"

transform = transforms.Compose([
    transforms.Resize((224,224)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
])

train_data = datasets.ImageFolder(train_dir, transform=transform)
val_data   = datasets.ImageFolder(val_dir,   transform=transform)

train_loader = DataLoader(train_data, batch_size=16, shuffle=True)
val_loader   = DataLoader(val_data, batch_size=16)

num_classes = len(train_data.classes)
device = "cpu"

# 🔥 FIX FOR ERROR
weights = ResNet50_Weights.DEFAULT
model = resnet50(weights=weights)
model.fc = nn.Linear(model.fc.in_features, num_classes)
model.to(device)

criterion = nn.CrossEntropyLoss()
optimizer = torch.optim.Adam(model.parameters(), lr=0.0008)

print("\nClasses:", train_data.classes)

for epoch in range(10):
    model.train()
    loss_sum = 0
    for img, lbl in train_loader:
        img,lbl = img.to(device),lbl.to(device)
        optimizer.zero_grad()
        loss = criterion(model(img), lbl)
        loss.backward()
        optimizer.step()
        loss_sum += loss.item()
    
    # Validation
    model.eval()
    correct = 0
    with torch.no_grad():
        for img,lbl in val_loader:
            img,lbl = img.to(device),lbl.to(device)
            pred = model(img).argmax(1)
            correct += (pred==lbl).sum().item()
    
    acc = correct/len(val_data)
    print(f"Epoch {epoch+1}/10 | Loss={loss_sum:.2f} | Val Acc={acc:.4f}")

torch.save(model,"exported_model/maize_resnet50.pth")
print("\n🌽 Model Saved --> exported_model/maize_resnet50.pth")
