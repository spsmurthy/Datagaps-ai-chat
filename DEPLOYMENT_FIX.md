# Azure App Service Deployment Issue - Fix Applied

## Problem Description
Your Azure App Service was showing the default PHP placeholder page ("Your web app is running and waiting for your content") instead of your Python/Node.js application, even though the deployment appeared successful.

## Root Cause
The issue was in the **Infrastructure as Code (Bicep) configuration** (`infra/main.bicep`):

1. **Missing Startup Command**: The `backend` module definition did not specify an `appCommandLine` parameter
2. **App Service Default Behavior**: When no startup command is provided, Azure App Service defaults to looking for a PHP application and serves a placeholder page
3. **Your Application Wasn't Starting**: Without the startup command, Gunicorn (your WSGI server) was never invoked to start the Python Flask/Quart application

## Fix Applied

### File: `infra/main.bicep` (Lines 101-117)
Added the following startup command to the `backend` module:

```bicep
appCommandLine: 'gunicorn --conf gunicorn.conf.py --workers 4 app:app'
```

This tells Azure App Service to:
- Use **Gunicorn** as the application server (configured by `gunicorn.conf.py`)
- Start with **4 workers** for handling concurrent requests
- Serve the **app:app** WSGI application (from your `app.py` file)

## How It Works

### Deployment Pipeline
1. **Pre-package Hook** (`azure.yaml`): 
   - Installs frontend dependencies: `npm install`
   - Builds frontend: `npm run build`
   - Output goes to `static/` folder

2. **Deployment to App Service**:
   - Python dependencies installed from `requirements.txt`
   - App Service uses the startup command to launch Gunicorn
   - Gunicorn starts your Flask/Quart application
   - Static files from `frontend/dist` are served via the `static/` route

3. **Runtime**:
   - Your application is served on port `0.0.0.0` (configured in `gunicorn.conf.py`)
   - Requests are routed to your backend
   - API calls are processed by the Flask/Quart app
   - Static assets (React frontend) are served from the `static/` folder

## Next Steps

1. **Redeploy Your Application**:
   ```bash
   azd deploy
   ```

2. **Verify the Deployment**:
   - Check the Azure App Service logs in Azure Portal
   - Navigate to: **App Service → Log stream** to see startup messages
   - Your app should now be accessible at `https://datagaps-ai-chat.azurewebsites.net`

3. **Troubleshooting** (if issues persist):
   - Check **Deployment Center** for any build/deployment errors
   - Review **Log stream** in App Service for runtime errors
   - Verify all environment variables are set correctly in **Configuration → Application settings**

## Important Configuration Files

- **`app.py`**: Your main Flask/Quart application
- **`gunicorn.conf.py`**: Server configuration (workers, timeout, binding address)
- **`requirements.txt`**: Python dependencies
- **`infra/main.bicep`**: Infrastructure definition (now includes startup command)
- **`azure.yaml`**: Azure Developer CLI configuration

## Additional Notes

- The startup command uses Gunicorn with the Uvicorn worker (configured in `gunicorn.conf.py`)
- Frontend build artifacts are included in the deployment via `static/` folder
- The application serves both backend API and frontend React app from the same App Service
