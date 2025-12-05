import os
import shutil
import pandas as pd
from sklearn.model_selection import train_test_split

# 🔥 CHANGE PATHS TO YOUR EXACT DIRECTORY 🔥
csv_path = r"C:\Users\admin\Desktop\Models\dataset_pest\rice\train.csv"
image_dir = r"C:\Users\admin\Desktop\Models\dataset_pest\rice\train_images"
output_dir = r"C:\Users\admin\Desktop\Models\Rice_Organized"

train_out = os.path.join(output_dir, "train")
val_out = os.path.join(output_dir, "val")

os.makedirs(train_out, exist_ok=True)
os.makedirs(val_out, exist_ok=True)

df = pd.read_csv(csv_path)
df['label'] = df['label'].str.strip()

# Split dataset 85% train, 15% validation
train_df, val_df = train_test_split(df, test_size=0.15, random_state=42, stratify=df['label'])

def copy_images(data, split_folder):
    for _, row in data.iterrows():
        label = row['label']
        image_name = row['image_id']

        src_path = os.path.join(image_dir, image_name)  # where images are now
        dest_class_folder = os.path.join(split_folder, label)

        os.makedirs(dest_class_folder, exist_ok=True)

        if os.path.exists(src_path):
            shutil.copy(src_path, os.path.join(dest_class_folder, image_name))

copy_images(train_df, train_out)
copy_images(val_df, val_out)

print("\n================ DONE ================")
print("✔ Images successfully copied")
print(f"Train images: {len(train_df)}")
print(f"Val images:   {len(val_df)}")
print("======================================\n")
