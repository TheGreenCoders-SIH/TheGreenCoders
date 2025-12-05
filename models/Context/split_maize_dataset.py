import os, shutil, random
from tqdm import tqdm

source = "dataset_pest/maize/data"
output = "Maize_Organized"
train_ratio = 0.8

os.makedirs(f"{output}/train", exist_ok=True)
os.makedirs(f"{output}/val", exist_ok=True)

for cls in os.listdir(source):
    src = os.path.join(source, cls)
    if not os.path.isdir(src): continue
    
    images = [f for f in os.listdir(src) if f.lower().endswith(("jpg","jpeg","png"))]
    random.shuffle(images)
    split = int(len(images)*train_ratio)
    
    train_files = images[:split]
    val_files = images[split:]

    os.makedirs(f"{output}/train/{cls}", exist_ok=True)
    os.makedirs(f"{output}/val/{cls}", exist_ok=True)

    for img in tqdm(train_files, desc=f"Train -> {cls}"):
        shutil.copy(os.path.join(src, img), f"{output}/train/{cls}/{img}")

    for img in tqdm(val_files, desc=f"Val -> {cls}"):
        shutil.copy(os.path.join(src, img), f"{output}/val/{cls}/{img}")

print("\n✅ Split completed — Check folder `Maize_Organized`")
