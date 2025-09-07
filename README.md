# SPMI-IF-FRONTEND

## Static Kurikulum Configuration

This project now uses a static approach to Kurikulum data as the database table for Kurikulum has been removed.

### Environment Variables

Create a `.env` file in the root of the project with these variables:

```
VITE_DEFAULT_KURIKULUM_ID=2020
VITE_KURIKULUM_TITLE="Kurikulum Informatika 2020"
VITE_KURIKULUM_MIN_SKS=144
```

### Architecture Changes

- Removed dynamic fetching of Kurikulum data from API
- All components now use a static Kurikulum ID (2020)
- Created a shared store for Kurikulum static data
- Added routing helpers to maintain current URL structure
