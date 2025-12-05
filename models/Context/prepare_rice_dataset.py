import os
import pandas as pd
import shutil

# Paths
base = "dataset_pest/rice"
csv_path = f"{base}/train.csv"
train_img_path = f"{base}/train_images"
out_train = "Rice_Organized/train"
out_val   = "Rice_Organized/val"

os.makedirs(out_train, exist_ok=True)
os.makedirs(out_val, exist_ok=True)

# Load CSV
df = pd.read_csv(csv_path)

# Create folder for each label
labels = df['label'].unique()
for lbl in labels:
    os.makedirs(f"{out_train}/{lbl}", exist_ok=True)
    os.makedirs(f"{out_val}/{lbl}", exist_ok=True)

# Split → 90% train , 10% val
for lbl in labels:
    files = df[df['label']==lbl]['image_id'].tolist()
    split = int(len(files)*0.9)

    for i,f in enumerate(files):
        src = f"{train_img_path}/{f}"
        if not os.path.exists(src): continue

        if i < split:
            shutil.copy(src, f"{out_train}/{lbl}/{f}")
        else:
            shutil.copy(src, f"{out_val}/{lbl}/{f}")

print("\n✔ Rice dataset prepared successfully!")
print("📁 Output folder: Rice_Organized/")
