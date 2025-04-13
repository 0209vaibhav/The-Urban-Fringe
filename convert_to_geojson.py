import pandas as pd
import geopandas as gpd
from shapely.geometry import Point

# Load the cleaned dataset
df = pd.read_csv("Sidewalk cafes/data/3 datasets/cleaned-noduplicates-combined-manhattan.csv")

# Create geometry column from latitude and longitude
# Use inspection coordinates first, fall back to application coordinates if needed
df['latitude'] = df['Latitude_inspect'].fillna(df['Latitude_app'])
df['longitude'] = df['Longitude_inspect'].fillna(df['Longitude_app'])

# Create Point geometries
geometry = [Point(xy) for xy in zip(df['longitude'], df['latitude'])]

# Create a GeoDataFrame
gdf = gpd.GeoDataFrame(df, geometry=geometry)

# Set the coordinate reference system (CRS) to WGS84 (lat/lon)
gdf.set_crs(epsg=4326, inplace=True)

# Drop the temporary coordinate columns
gdf = gdf.drop(['latitude', 'longitude'], axis=1)

# Save to GeoJSON
output_path = "Sidewalk cafes/data/3 datasets/cleaned-noduplicates-combined-manhattan.geojson"
gdf.to_file(output_path, driver="GeoJSON")

print(f"GeoJSON file saved to: {output_path}")
print(f"Number of features in GeoJSON: {len(gdf)}")
print("\nGeoJSON Properties:")
print("Coordinate Reference System:", gdf.crs)
print("Geometry Type:", gdf.geometry.type.unique()) 