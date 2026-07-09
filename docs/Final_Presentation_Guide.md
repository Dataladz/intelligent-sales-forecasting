# Olist Sales Forecasting Presentation Guide
## دليل العرض التقديمي للمشروع (Slide-by-Slide & Speaking Points)

يحتوي هذا الدليل على تقسيم الشرائح (Slides) باللغة الإنجليزية، مع **نقاط الحديث المقترحة بالعامية المصرية (Speaking Points)** لشرح كل شريحة باحترافية أمام لجنة التقييم أو أصحاب الأعمال.

---

### Slide 1: Title & Introduction
* **Slide Title:** Sales Forecasting & Demand Prediction for Brazilian E-Commerce (Olist)
* **Visuals:** Project Logo, Team Names, and a high-level system diagram.
* **Content:**
  * Objective: Predict future sales to optimize inventory and supply chain operations.
  * Dataset: 100k+ orders aggregated into a 700-day daily time series.

🗣️ **الكلام اللي يتقال (Egyptian Arabic):**
> "مساء الخير جميعاً. انهارده هنعرض مشروع توقع المبيعات والتنبؤ بالطلب لمنصة Olist للتجارة الإلكترونية في البرازيل.
> هدفنا الأساسي من المشروع ده مش مجرد بناء نموذج ذكاء اصطناعي، ولكن حل مشكلة تجارية حقيقية بتواجه شركات التجارة الإلكترونية، وهي إزاي نقدر نتوقع حجم المبيعات اليومية بدقة عشان نحسن إدارة المخازن ونمنع تراكم البضائع أو نفادها."

---

### Slide 2: The Business Problem & ROI
* **Slide Title:** The Cost of Bad Forecasting
* **Content:**
  * **Under-forecasting (Stockouts):** Lost revenue, customer churn, lower seller ratings.
  * **Over-forecasting (Excess Inventory):** Capital lock-up, warehouse storage fees, depreciation.
  * **The Solution:** A predictive dashboard enabling data-driven inventory, staffing, and logistics planning.

🗣️ **الكلام اللي يتقال (Egyptian Arabic):**
> "في مجال الـ E-commerce، التوقع الخاطئ للطلب بيكلف الشركة كتير. لو توقعنا مبيعات أقل من الحقيقي، هيحصل نفاد للمخزون (Stockouts) وده معناه خسارة مبيعات مباشرة وعملاء زعلانين. 
> ولو توقعنا مبيعات أكتر، البضاعة هتتراكم في المخازن وتكلفنا مصاريف تخزين ورأس مال معطل.
> الحل اللي بنقدمه بيساعد متخذي القرار والـ Sellers إنهم يجهزوا كميات البضاعة المناسبة والعمالة والخدمات اللوجستية مسبقاً بناءً على توقعات علمية دقيقة."

---

### Slide 3: Milestone 1: Data Preprocessing & EDA
* **Slide Title:** Data Ingestion & Key Insights
* **Visuals:** Growth Trend line plot, Weekly seasonality bar chart, Black Friday surge peak.
* **Content:**
  * 700 days of history (Late 2016 - Mid 2018).
  * Outlier capping (excluding Black Friday).
  * Key Insight 1: Strong weekly seasonality (Mondays/Tuesdays are peaks, weekends drop by 30%).
  * Key Insight 2: Promotional impact (Black Friday 2017 caused a 300% sales surge).

🗣️ **الكلام اللي يتقال (Egyptian Arabic):**
> "في المرحلة الأولى، جمعنا البيانات ونظفناها وحولناها من 100 ألف طلب فردي لسلسلة زمنية يومية ممتدة لـ 700 يوم.
> استبعدنا القيم الشاذة جداً (Outliers) عشان الموديل ميتلخبطش، وحافظنا على طفرة مبيعات البلاك فرايداي.
> وخرجنا بملحوظتين مهمين جداً من الـ EDA: 
> أولاً، فيه موسمية أسبوعية واضحة جداً؛ المبيعات بتوصل ذروتها يوم الاتنين والتلات وبتقل بنسبة 30% يوم السبت والأحد.
> ثانياً، الحملات الترويجية ليها تأثير ضخم؛ مبيعات البلاك فرايداي في 2017 زادت بـ 300% عن المعدل الطبيعي لشهر نوفمبر."

---

### Slide 4: Milestone 2: Advanced Feature Engineering
* **Slide Title:** Preparing Data for Machine Learning
* **Content:**
  * ADF Stationarity Test: Stationary ($p$-value $= 0.023 < 0.05$).
  * Engineered Features:
    * Calendar: Day of week, Month, Quarter, Weekend flag.
    * Exogenous: Brazilian National Holidays (using `holidays` library).
    * Autoregressive (Lags): Sales from 1, 7, 14, and 30 days ago.
    * Rolling Windows: 7-day and 30-day moving average and standard deviation.

🗣️ **الكلام اللي يتقال (Egyptian Arabic):**
> "عشان نخلي خوارزميات الـ Machine Learning تفهم البيانات الزمنية، عملنا خطوة هندسة الميزات (Feature Engineering).
> أولاً تأكدنا باختبار ADF الإحصائي إن البيانات مستقرة (Stationary) وجاهزة للتدريب.
> بعد كده استخرجنا 11 ميزة أساسية: ميزات الوقت واليوم، والإجازات الرسمية في البرازيل لأن الإجازات المبيعات بتقل فيها بشكل حاد.
> وكمان عملنا الـ Lag Features والـ Rolling Averages لآخر 7 أيام و30 يوم عشان الموديل يقدر يفهم الاتجاه الحالي (Trend) والتذبذب (Volatility) في السوق."

---

### Slide 5: Milestone 3: Model Tuning & Validation
* **Slide Title:** Champion Model Selection
* **Visuals:** Model comparison table, Residuals plots.
* **Content:**
  * Validation Strategy: 5-Fold TimeSeriesSplit (prevents future data leakage).
  * Performance Comparison (MAE):
    * SARIMAX: MAE = $21,262.27 (Failed due to non-linear spikes).
    * Random Forest: MAE = $4,890.65.
    * Tuned XGBoost: MAE = $4,907.12 (Selected Champion).
  * Experiment Tracking: Managed and logged using **MLflow**.

🗣️ **الكلام اللي يتقال (Egyptian Arabic):**
> "في مرحلة بناء النموذج، جربنا كذا خوارزمية واستخدمنا TimeSeriesSplit لـ 5 مراحل عشان نتفادى تسريب البيانات وتكون التقييمات حقيقية.
> الموديلات الإحصائية التقليدية زي SARIMAX فشلت تماماً في التعامل مع طفرات السوق غير الخطية.
> في المقابل، الموديلات المعتمدة على الأشجار (Tree-based models) زي Random Forest و XGBoost أثبتت كفاءة عالية جداً.
> اخترنا الـ Tuned XGBoost كنموذج نهائي للتشغيل الفعلي لأنه بيحقق أفضل توازن بين دقة التوقع (MAE تقريباً $4,907)، وسرعة استخراج التوقعات وحجم الموديل الخفيف وسهولة الـ Deployment. وطبعاً كل التجارب دي متسجلة بالكامل على منصة MLflow."

---

### Slide 6: Milestone 4: Web Deployment & Architecture
* **Slide Title:** Production Architecture & Deployment
* **Visuals:** Architecture diagram (React -> FastAPI -> XGBoost Model).
* **Content:**
  * FastAPI Backend: Fast, documented endpoints (`/predict` & `/predict/sequence`).
  * React Web Interface: Interactive client for day-to-day business operations.
  * Streamlit Dashboard: Internal analytics and historical comparison.
  * Containerization: Unified stack running via Docker Compose.

🗣️ **الكلام اللي يتقال (Egyptian Arabic):**
> "الموديل بتاعنا مش مجرد كود في Jupyter Notebook؛ احنا بنينا نظام تشغيل متكامل مكون من 3 طبقات:
> 1. الـ FastAPI Backend وده السيرفر المسؤول عن استقبال الطلبات وحساب الميزات اللحظية وتشغيل الموديل.
> 2. واجهة مستخدم React ممتازة وجذابة ومناسبة للمستخدم العادي عشان يكتب أي تاريخ ويجيله التوقع فوراً.
> 3. لوحة تحكم Streamlit مخصصة لـ مُحللي البيانات عشان يشوفوا الاتجاهات التاريخية والمستقبلية بالتفصيل.
> والنظام ده كله شغال بـ Docker Compose بضغطة زر واحدة."

---

### Slide 7: MLOps: Monitoring & Retraining Setup
* **Slide Title:** Ensuring Long-Term Model Reliability
* **Content:**
  * Forecast Accuracy Checks: Sliding 30-day window metrics calculation.
  * Alerts Trigger: Slack notifications if $R^2 < 0.60$ or MAE increases by > 20%.
  * Automated Retraining (`src/retrain.py`): Scheduled weekly or triggered by drift to evaluate new models and auto-update if performance improves.

🗣️ **الكلام اللي يتقال (Egyptian Arabic):**
> "عشان نضمن إن دقة الموديل متقلش بمرور الوقت بسبب تغير سلوك المشترين أو ظروف السوق، عملنا نظام مراقبة (Model Monitoring).
> السيستم بيقارن يومياً التوقعات بالمبيعات الحقيقية الفعلية لآخر 30 يوم، ولو لقى معامل التحديد $R^2$ قل عن 0.60 أو الخطأ زاد عن 20%، بيبعت تنبيه فوري لفريق مهندسي البيانات على Slack.
> في نفس الوقت، سكريبت إعادة التدريب التلقائي `retrain.py` بيشتغل عشان يدرب الموديل على البيانات الجديدة، ويقارن الموديل الجديد بالقديم، ولو الجديد أفضل، بيحدثه تلقائياً في الـ Production بدون أي تدخل بشري."

---

### Slide 8: Milestone 5: Future Enhancements & Value
* **Slide Title:** Business Value & Next Steps
* **Content:**
  * Future Features: Integrate marketing spend, discounts, and Google Trends.
  * Granular Predictions: Predict sales per product category or customer location.
  * Advanced Models: Test Deep Learning models (e.g. Temporal Fusion Transformers).

🗣️ **الكلام اللي يتقال (Egyptian Arabic):**
> "كخطة مستقبلية لتطوير المشروع، بنقترح إضافة بيانات المصاريف التسويقية والخصومات لأنها بتأثر بشكل مباشر على المبيعات وهتساعد الموديل يتوقع طفرات المبيعات بدقة أكبر.
> كمان ممكن نطور الموديل عشان يتوقع المبيعات على مستوى فئات المنتجات (مثلاً الأجهزة الإلكترونية لوحدها والملابس لوحدها) أو على مستوى مخازن المحافظات المختلفة عشان نحسن اللوجستيات أكتر.
> شكراً ليكم وجاهز لأي أسئلة."
