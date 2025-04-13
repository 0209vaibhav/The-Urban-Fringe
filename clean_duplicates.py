import pandas as pd
import numpy as np
from difflib import SequenceMatcher

def clean_business_name(name):
    if pd.isna(name):
        return name
    # Standardize common business suffixes
    name = str(name).strip()
    name = name.replace('LLC', 'LLC').replace('LLC.', 'LLC')
    name = name.replace('INC', 'INC').replace('INC.', 'INC')
    name = name.replace('CORP', 'CORP').replace('CORP.', 'CORP')
    # Remove extra spaces
    name = ' '.join(name.split())
    return name

# Load the dataset
df = pd.read_csv("Sidewalk cafes/data/3 datasets/combined_2datasets.csv")

# Filter for Manhattan only
df = df[df['Borough'] == 'Manhattan']

# Clean business names
df['LegalBusinessName'] = df['LegalBusinessName'].apply(clean_business_name)

# Create a unique identifier for each business
df['BusinessID'] = df['LegalBusinessName'] + '_' + df['BusinessAddress']

# Sort by inspection date (most recent first)
df['InspectedOn'] = pd.to_datetime(df['InspectedOn'])
df = df.sort_values('InspectedOn', ascending=False)

# Remove duplicates while keeping the most recent inspection
# First, remove exact duplicates based on key columns
key_columns = ['RestaurantName', 'LegalBusinessName', 'BusinessAddress', 'RestaurantInspectionID']
df_cleaned = df.drop_duplicates(subset=key_columns, keep='first')

# Then, for each business, keep only the most recent inspection
df_cleaned = df_cleaned.drop_duplicates(subset=['BusinessID'], keep='first')

# Drop the temporary BusinessID column
df_cleaned = df_cleaned.drop('BusinessID', axis=1)

# Save the cleaned dataset
output_path = "Sidewalk cafes/data/3 datasets/cleaned-noduplicates-combined-manhattan.csv"
df_cleaned.to_csv(output_path, index=False)

# Print summary of cleaning
print(f"Original dataset shape: {df.shape}")
print(f"Cleaned dataset shape: {df_cleaned.shape}")
print(f"Number of duplicates removed: {len(df) - len(df_cleaned)}")
print(f"\nCleaned dataset saved to: {output_path}")

# Print some statistics about the cleaned dataset
print("\nCleaned Dataset Statistics:")
print(f"Number of unique restaurants: {df_cleaned['RestaurantName'].nunique()}")
print(f"Number of unique inspection IDs: {df_cleaned['RestaurantInspectionID'].nunique()}")
print(f"Number of unique business addresses: {df_cleaned['BusinessAddress'].nunique()}") 