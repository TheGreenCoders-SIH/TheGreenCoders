import os
import shutil

# ---- CHANGE THIS PATH TO YOUR REAL LOCATION ----
BASE = r"C:\Users\admin\Desktop\Models\dataset_pest\plant_doc"

names = [
    "Apple Scab Leaf", "Apple leaf", "Apple rust leaf", "Bell_pepper leaf spot", "Bell_pepper leaf",
    "Blueberry leaf", "Cherry leaf", "Corn Gray leaf spot", "Corn leaf blight", "Corn rust leaf",
    "Peach leaf", "Potato leaf early blight", "Potato leaf late blight", "Potato leaf",
    "Raspberry leaf", "Soyabean leaf", "Soybean leaf", "Squash Powdery mildew leaf",
    "Strawberry leaf", "Tomato Early blight leaf", "Tomato Septoria leaf spot",
    "Tomato leaf bacterial spot", "Tomato leaf late blight", "Tomato leaf mosaic virus",
    "Tomato leaf yellow virus", "Tomato leaf", "Tomato mold leaf",
    "Tomato two spotted spider mites leaf", "grape leaf black rot", "grape leaf"
]

OUT = "PlantDoc_Organized"
train_out = os.path.join(OUT, "train")
val_out   = os.path.join(OUT, "val")

os.makedirs(train_out, exist_ok=True)
os.makedirs(val_out, exist_ok=True)

for cls in names:
    os.makedirs(os.path.join(train_out, cls), exist_ok=True)
    os.makedirs(os.path.join(val_out, cls), exist_ok=True)

img_dir = os.path.join(BASE, "train", "images")
label_dir = os.path.join(BASE, "train", "labels")

count = 0

for label in os.listdir(label_dir):
    if not label.endswith(".txt"): 
        continue

    img_name = label.replace(".txt", ".jpg")
    img_path = os.path.join(img_dir, img_name)
    label_path = os.path.join(label_dir, label)

    if not os.path.exists(img_path):
        print(f"⚠ Image missing for {label}")
        continue

    with open(label_path, "r") as f:
        line = f.readline().strip()
        if line == "":
            cls = 0
        else:
            cls = int(line.split()[0])

    class_name = names[cls]
    target = train_out if hash(img_name) % 10 != 0 else val_out

    shutil.copy(img_path, os.path.join(target, class_name, img_name))
    count += 1

print("\n================ DONE ================")
print(f"Total images organized: {count}")
print(f"📁 Check → {OUT}/train/  and  {OUT}/val/")
