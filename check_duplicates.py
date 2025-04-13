import pandas as pd
import numpy as np

# Load the dataset
df = pd.read_csv("Sidewalk cafes/data/3 datasets/combined_2datasets.csv")

# Print basic information about the dataset
print("Dataset shape:", df.shape)
print("\nNumber of unique restaurants:", df['RestaurantName'].nunique())
print("Number of unique inspection IDs:", df['RestaurantInspectionID'].nunique())

# Check for duplicates based on key columns
key_columns = ['RestaurantName', 'LegalBusinessName', 'BusinessAddress', 'RestaurantInspectionID']
duplicates = df[df.duplicated(subset=key_columns, keep=False)]

print("\nNumber of duplicate entries based on key columns:", len(duplicates))

if len(duplicates) > 0:
    print("\nSample of duplicate entries:")
    print(duplicates[key_columns].head().to_string())

# Check for duplicates based on inspection ID only
inspection_duplicates = df[df.duplicated(subset=['RestaurantInspectionID'], keep=False)]
print("\nNumber of duplicate inspection IDs:", len(inspection_duplicates))

# Check for duplicates based on business name and address
business_duplicates = df[df.duplicated(subset=['LegalBusinessName', 'BusinessAddress'], keep=False)]
print("\nNumber of duplicate businesses (same name and address):", len(business_duplicates))

# Check for potential duplicate entries with slightly different names
from difflib import SequenceMatcher

def similar(a, b):
    # Handle null values
    if pd.isna(a) or pd.isna(b):
        return 0
    return SequenceMatcher(None, str(a), str(b)).ratio()

# Create a list of unique business names, excluding null values
unique_names = df['LegalBusinessName'].dropna().unique()

# Find potential similar names (threshold can be adjusted)
similar_names = []
print("\nSearching for similar business names...")
for i in range(len(unique_names)):
    for j in range(i+1, min(i+100, len(unique_names))):  # Limit the comparison to nearby entries
        if similar(unique_names[i], unique_names[j]) > 0.9:  # 90% similarity threshold
            similar_names.append((unique_names[i], unique_names[j]))

print("\nNumber of potential similar business names found:", len(similar_names))
if similar_names:
    print("\nSample of similar business names:")
    for name1, name2 in similar_names[:5]:  # Show first 5 pairs
        print(f"'{name1}' and '{name2}'") 