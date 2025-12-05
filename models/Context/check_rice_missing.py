import os
import pandas as pd

csv_path = r"C:\Users\admin\Desktop\Models\dataset_pest\rice\train.csv"
image_dir = r"C:\Users\admin\Desktop\Models\dataset_pest\rice\train_images"

df = pd.read_csv(csv_path)
df['image_id'] = df['image_id'].str.strip()

missing = []
present = 0

for img in df['image_id']:
    if not os.path.exists(os.path.join(image_dir, img)):
        missing.append(img)
    else:
        present += 1

print(f"\nTotal entries in CSV: {len(df)}")
print(f"Found images        : {present}")
print(f"Missing images      : {len(missing)}\n")

if missing:
    print("Example missing files:")
    print(missing[:20])
else:
    print("✔ All image names match correctly!")
