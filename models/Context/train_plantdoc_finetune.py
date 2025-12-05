import os, torch, torch.nn as nn
from torch.utils.data import DataLoader
from torchvision import datasets, transforms, models
from torch.optim import Adam
from torch.optim.lr_scheduler import StepLR

train_dir = "PlantDoc_Organized/train"
val_dir   = "PlantDoc_Organized/val"
num_classes = len(os.listdir(train_dir))

transform_train = transforms.Compose([
    transforms.Resize((224,224)),
    transforms.RandomHorizontalFlip(),
    transforms.RandomRotation(15),
    transforms.ColorJitter(brightness=0.3, contrast=0.3),
    transforms.RandomResizedCrop(224, scale=(0.7,1.0)),
    transforms.ToTensor(),
    transforms.Normalize([0.485,0.456,0.406],[0.229,0.224,0.225]),
])

transform_val = transforms.Compose([
    transforms.Resize((224,224)),
    transforms.ToTensor(),
    transforms.Normalize([0.485,0.456,0.406],[0.229,0.224,0.225]),
])

train_loader = DataLoader(datasets.ImageFolder(train_dir, transform_train), batch_size=16, shuffle=True)
val_loader   = DataLoader(datasets.ImageFolder(val_dir, transform_val), batch_size=16)

device = "cuda" if torch.cuda.is_available() else "cpu"
print("Training on:", device)

model = models.resnet50(weights=None)
model.fc = nn.Linear(model.fc.in_features, num_classes)
model.load_state_dict(torch.load("exported_model/plantdoc_resnet50.pth", map_location=device))

# 🔥 Unfreeze last 40% layers for fine-tuning
for name, param in model.named_parameters():
    if "layer3" in name or "layer4" in name or "fc" in name:
        param.requires_grad = True

model.to(device)

criterion = nn.CrossEntropyLoss()
optimizer = Adam(filter(lambda p: p.requires_grad, model.parameters()), lr=0.0003)
scheduler = StepLR(optimizer, step_size=5, gamma=0.8)  # reduce LR slowly

epochs = 20  # <- longer training now

for epoch in range(epochs):
    model.train()
    loss_sum = 0
    for imgs, lbl in train_loader:
        imgs, lbl = imgs.to(device), lbl.to(device)
        optimizer.zero_grad()
        loss = criterion(model(imgs), lbl)
        loss.backward()
        optimizer.step()
        loss_sum += loss.item()

    # Validation
    model.eval()
    correct = 0
    with torch.no_grad():
        for imgs, lbl in val_loader:
            imgs, lbl = imgs.to(device), lbl.to(device)
            correct += (model(imgs).argmax(1) == lbl).sum().item()

    acc = correct / len(val_loader.dataset)
    scheduler.step()
    print(f"Epoch {epoch+1}/{epochs} | Loss={loss_sum:.2f} | Val Acc={acc:.4f}")

torch.save(model.state_dict(), "exported_model/plantdoc_resnet50_finetuned.pth")
print("\n🔥 Fine-tune Completed — Saved as exported_model/plantdoc_resnet50_finetuned.pth")
