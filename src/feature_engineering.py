import pandas as pd
import numpy as np
import holidays
import os

def load_processed_data(file_path):
    """Loads the aggregated time series data."""
    df = pd.read_csv(file_path, parse_dates=['order_purchase_timestamp'])
    df = df.set_index('order_purchase_timestamp')
    return df

def create_time_features(df):
    """Extracts basic time components from the index."""
    print("Creating time features...")
    df = df.copy()
    df['day_of_week'] = df.index.dayofweek
    df['month'] = df.index.month
    df['quarter'] = df.index.quarter
    df['is_weekend'] = df['day_of_week'].isin([5, 6]).astype(int)
    return df

def add_holiday_flags(df, country='BR'):
    """Adds a binary flag if the date is a holiday in the specified country."""
    print(f"Adding holiday flags for {country}...")
    df = df.copy()
    
    # Get the range of years in our data
    years = df.index.year.unique().tolist()
    
    # Initialize holidays calendar
    country_holidays = holidays.country_holidays(country, years=years)
    
    # Map index dates to the holiday calendar
    df['is_holiday'] = df.index.map(lambda x: x in country_holidays).astype(int)
    return df

def create_lag_features(df, target_col='total_sales', lags=[1, 7, 14, 30]):
    """Creates lag features for the target column."""
    print("Creating lag features...")
    df = df.copy()
    for lag in lags:
        df[f'{target_col}_lag_{lag}'] = df[target_col].shift(lag)
    return df

def create_rolling_features(df, target_col='total_sales', windows=[7, 30]):
    """Creates rolling average features."""
    print("Creating rolling features...")
    df = df.copy()
    for window in windows:
        df[f'{target_col}_rolling_avg_{window}'] = df[target_col].rolling(window=window).mean()
        df[f'{target_col}_rolling_std_{window}'] = df[target_col].rolling(window=window).std()
    return df

def feature_engineering_pipeline(input_path, output_path):
    """Runs the full feature engineering pipeline and saves the result."""
    df = load_processed_data(input_path)
    
    # Apply feature engineering steps
    df = create_time_features(df)
    df = add_holiday_flags(df, country='BR')
    df = create_lag_features(df, target_col='total_sales')
    df = create_rolling_features(df, target_col='total_sales')
    
    # Drop rows with NaN values caused by shifting/rolling (first 30 days)
    df = df.dropna()
    
    df.to_csv(output_path)
    print(f"Engineered features saved to {output_path}")

if __name__ == "__main__":
    processed_dir = "data/processed"
    input_file = os.path.join(processed_dir, 'time_series_sales.csv')
    output_file = os.path.join(processed_dir, 'features_sales.csv')
    
    feature_engineering_pipeline(input_file, output_file)
