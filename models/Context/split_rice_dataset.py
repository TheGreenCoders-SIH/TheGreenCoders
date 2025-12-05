import os
import shutil
import random

source_dir = r"C:\Users\admin\Desktop\Models\dataset_pest\rice\train_images"  # <--- FIXED
dest_dir   = r"C:\Users\admin\Desktop\Models\Rice_Organized"

train_out = os.path.join(dest_dir, "train")
val_out   = os.path.join(dest_dir, "val")

os.makedirs(train_out, exist_ok=True)
os.makedirs(val_out, exist_ok=True)

classes = [c for c in os.listdir(source_dir) if os.path.isdir(os.path.join(source_dir, c))]
print("\nFound Classes:", classes)

for cls in classes:
    cls_path = os.path.join(source_dir, cls)
    images = [i for i in os.listdir(cls_path) if i.lower().endswith((".jpg",".jpeg",".png",".jfif"))]

    if len(images) == 0:
        print(f"⚠ No images found in class: {cls}")
        continue

    random.shuffle(images)
    split = int(len(images) * 0.80)

    os.makedirs(os.path.join(train_out, cls), exist_ok=True)
    os.makedirs(os.path.join(val_out, cls), exist_ok=True)

    for img in images[:split]:
        shutil.copy(os.path.join(cls_path, img), os.path.join(train_out, cls, img))

    for img in images[split:]:
        shutil.copy(os.path.join(cls_path, img), os.path.join(val_out, cls, img))

print("\n✔ Rice dataset split completed!")
print("📁 Train images:", sum(len(files) for _,_,files in os.walk(train_out)))
print("📁 Val images  :", sum(len(files) for _,_,files in os.walk(val_out)))
