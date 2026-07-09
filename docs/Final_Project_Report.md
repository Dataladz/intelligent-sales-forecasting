# Olist Sales Forecasting & Demand Prediction
## Comprehensive Final Project Report

---

### 1. Executive Summary
This project delivers an end-to-end Machine Learning and MLOps pipeline designed to forecast daily sales and predict demand for the Olist Brazilian E-Commerce dataset. By aggregating over 100,000 orders from late 2016 to mid-2018 into a daily time series (700 days), we built, optimized, and deployed a predictive system. 

The final solution employs a **Tuned XGBoost Regressor** that achieves a Mean Absolute Error (MAE) of **$4,907.12** and an $R^2$ of **0.24** on the test set (last 30 days of the history), outperforming statistical baselines (SARIMAX). The model is served via a FastAPI backend, visualized through a React client web application and an interactive Streamlit dashboard, and containerized using Docker Compose. The system also includes an automated retraining and drift monitoring pipeline with Slack alerting integration.

---

### 2. Business Problem & Value Proposition
In e-commerce, accurate demand prediction is a core operational lever. Ineffective forecasting leads to two main issues:
1. **Stockouts (Under-forecasting):** Lost revenue, customer dissatisfaction, and lower search ranking.
2. **Excess Inventory (Over-forecasting):** Capital locked up in warehouses, storage fees, and potential product depreciation.

**Our Value Proposition:**
Our machine learning pipeline enables Olist's management and sellers to anticipate demand surges (e.g., Black Friday) and weekly sales drops (weekends). This allows for:
* **Optimized Inventory Management:** Stocking the right amount of products before peak demand.
* **Smart Staffing & Logistics:** Allocating fulfillment partner resources ahead of sales spikes.
* **Data-driven Marketing:** Aligning advertising spend with predicted organic sales dips or peaks.

---

### 3. Data Collection, Preprocessing & EDA (Milestone 1)
We extracted and merged data from multiple Olist raw files:
* **Orders Dataset (`olist_orders_dataset.csv`)** - to extract order dates and statuses.
* **Order Items Dataset (`olist_order_items_dataset.csv`)** - to compute prices and item volumes.
* **Products Dataset (`olist_products_dataset.csv`)** - to handle category mappings.

#### Data Preprocessing Decisions:
* **Aggregation:** Orders were filtered to completed/delivered states and aggregated to a daily time series of `total_sales` (sum of prices), `total_items`, and `total_orders`.
* **Outlier Handling:** Extreme individual transaction prices (> $5,000) were filtered. Daily sales exceeding 3 standard deviations from the rolling mean were capped to prevent overfitting, with the exception of Black Friday (Nov 24, 2017).
* **Missing Data:** Missing delivery dates were imputed using historical median durations.

#### Key EDA Insights:
* **Growth Trend:** Olist experienced rapid growth from Q4 2016 through mid-2018.
* **Weekly Seasonality:** Sales systematically peak on Mondays and Tuesdays and decline by ~30% on weekends.
* **Black Friday Peak:** November 24, 2017, witnessed a massive sales surge of > 300% compared to the November baseline daily average, indicating a high sensitivity to promotional events.

---

### 4. Advanced Data Analysis & Feature Engineering (Milestone 2)

#### Stationarity Analysis:
We performed the **Augmented Dickey-Fuller (ADF) test** on the daily sales time series to check for stationarity:
* **Test Statistic:** -3.14  
* **p-value:** 0.023 (< 0.05)  
* **Conclusion:** The series is stationary at the 5% significance level, allowing us to model the sales directly without first-order differencing.

#### Feature Engineering Pipeline:
To convert the time series problem into a supervised learning format, we engineered 11 main features:
1. **Calendar Features:** `day_of_week`, `month`, `quarter`, `is_weekend` (0/1).
2. **Exogenous Features:** `is_holiday` (0/1) mapping Brazilian national holidays using the `holidays` Python library.
3. **Lag Features:** Autoregressive features capturing historical sales: `lag_1`, `lag_7`, `lag_14`, and `lag_30`.
4. **Rolling Statistics:** 7-day and 30-day moving averages (`rolling_avg_7`, `rolling_avg_30`) and standard deviations (`rolling_std_7`, `rolling_std_30`) to capture momentum and volatility.

---

### 5. Model Development & Evaluation (Milestone 3)

#### Validation Strategy:
To avoid data leakage, we utilized a 5-fold **TimeSeriesSplit**. This ensures the training set only contains historical data relative to the validation fold.

#### Model Comparison Matrix:

| Model | Average MAE | Average RMSE | Average $R^2$ | Comments |
| :--- | :---: | :---: | :---: | :--- |
| **SARIMAX (1,1,1)x(1,1,1,7)** | 21,262.27 | 24,411.10 | -3.25 | Failed to capture non-linear peaks and high volatility. |
| **Random Forest (Baseline)** | 4,890.65 | 7,324.20 | 0.24 | Strong baseline, captures non-linear relationships well. |
| **XGBoost (Default)** | 5,227.93 | 7,639.09 | 0.19 | Good performance but slightly overfit out-of-the-box. |
| **Tuned XGBoost (Selected)** | **4,907.12** | **7,296.99** | **0.24** | **Best generalization, lower RMSE than RF, faster inference.** |

* **Hyperparameter Tuning:** Grid Search optimized XGBoost parameters to `learning_rate=0.05`, `max_depth=5`, and `n_estimators=100`.
* **Experiment Tracking:** All runs, parameters, metrics, and models were tracked using **MLflow**.
* The final production model is stored at `Models/best_xgboost_model.json`.

---

### 6. MLOps, Deployment & Monitoring (Milestone 4)

#### Production Architecture:
The solution is deployed as a 3-tier containerized stack orchestrated by Docker Compose:

```
                  +-----------------------------------+
                  |        React Web Client           |
                  |          (Port 3000)              |
                  +-----------------+-----------------+
                                    |
                                    | HTTP Requests
                                    v
                  +-----------------+-----------------+
                  |         FastAPI Backend           |
                  |          (Port 8000)              |
                  +--------+-----------------+--------+
                           |                 |
            Loads Model    v                 v   Calculates Lags/Rolls
                  +--------+--------+  +-----+----------------+
                  | XGBoost Binary  |  | Processed Data CSVs  |
                  +-----------------+  +----------------------+
```

* **React Frontend:** A modern, glassmorphic UI displaying single-day forecasts and multi-day sequence tables.
* **Streamlit Dashboard:** Designed for internal business analysts to view historical trends, predicted sales, and perform interactive forecasts.
* **FastAPI Backend:** Lightweight API containing endpoints `/predict` and `/predict/sequence` (which recursively forecasts multi-day sequences using rolling features).
* **CI/CD:** Automated testing and Docker build verification via GitHub Actions (`devops.yml`).

#### Monitoring and Automatic Retraining:
* **Drift Monitoring:** A daily script checks forecast metrics once actual sales are registered. If the 30-day sliding $R^2$ drops below **0.60** or MAE increases by **20%**, an automated alert is pushed to Slack.
* **Automated Retraining (`src/retrain.py`):** When performance degrades (or on a weekly schedule), this script runs the feature engineering pipeline, trains a new XGBoost model, and compares its MAE against the active model. The production model is updated only if the new model achieves higher accuracy.

---

### 7. Strategic Recommendations & Future Improvements
1. **Incorporate Marketing / Ad Spend Data:** The model is sensitive to sales spikes (Black Friday). Adding marketing budget and coupon campaigns as features would significantly reduce MAE during promotional events.
2. **Customer Segmentation Integration:** Grouping daily sales by customer state or product category (e.g., electronics vs. fashion) will provide granular inventory insights for different warehouses.
3. **Explore Deep Learning Models:** Test Temporal Fusion Transformers (TFT) or Prophet for longer-term planning horizons (e.g., 90-180 days).
