import os
from torchvision import datasets, transforms

print("\n=== TEST DATASET READ ===")

path = r"C:\Users\admin\Desktop\Models\PlantDoc_Organized\train"

print("Checking folder exists:", os.path.exists(path))

if os.path.exists(path):
    print("Folders inside:")
    print(os.listdir(path))

try:
    dataset = datasets.ImageFolder(path, transform=transforms.ToTensor())
    print("\nClasses detected:", len(dataset.classes))
    print("Example classes:", dataset.classes[:10])
except Exception as e:
    print("\n❌ ERROR:", e)

print("\n=== END ===")
