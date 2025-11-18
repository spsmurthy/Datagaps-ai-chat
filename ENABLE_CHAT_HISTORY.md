# Enabling Chat History with Azure Cosmos DB

## Overview

Your Datagaps AI Chat app currently does **not** have CosmosDB configured, which means chat history is not being saved. Users cannot see previous conversations or continue past chats like in ChatGPT.

This guide will help you enable persistent chat history using Azure Cosmos DB.

---

## Why You Need CosmosDB

**Without CosmosDB:**
- ❌ No chat history saved
- ❌ Users lose conversations when they refresh the page
- ❌ Cannot return to previous conversations
- ❌ No conversation search or management
- ❌ History button is hidden

**With CosmosDB:**
- ✅ All conversations persisted
- ✅ Users can browse chat history
- ✅ Continue previous conversations
- ✅ Search and manage conversations
- ✅ Optional: Enable message feedback (thumbs up/down)

---

## Step 1: Create Azure Cosmos DB Account

### Option A: Using Azure Portal

1. **Navigate to Azure Portal**: https://portal.azure.com
2. **Create Resource** → Search for "Azure Cosmos DB"
3. **Select**: Azure Cosmos DB for NoSQL (not MongoDB, Cassandra, etc.)
4. **Configure**:
   - **Subscription**: Same as your web app (bae7fe23-95a8-4799-88e8-471689705000)
   - **Resource Group**: `EnterpriseAIWebChat` (same as your web app)
   - **Account Name**: Choose unique name (e.g., `datagaps-chat-history`)
   - **Location**: `East US` (same as your web app for best performance)
   - **Capacity Mode**: **Serverless** (recommended for cost savings)
   - **Apply Free Tier Discount**: Yes (if available)
5. **Review + Create** → Wait ~5 minutes for deployment

### Option B: Using Azure CLI

```powershell
# Set variables
$RESOURCE_GROUP = "EnterpriseAIWebChat"
$LOCATION = "eastus"
$COSMOS_ACCOUNT = "datagaps-chat-history"
$DATABASE_NAME = "db_conversation_history"
$CONTAINER_NAME = "conversations"

# Create Cosmos DB account (serverless)
az cosmosdb create `
  --name $COSMOS_ACCOUNT `
  --resource-group $RESOURCE_GROUP `
  --locations regionName=$LOCATION `
  --kind GlobalDocumentDB `
  --capabilities EnableServerless `
  --default-consistency-level Session

# Create database
az cosmosdb sql database create `
  --account-name $COSMOS_ACCOUNT `
  --resource-group $RESOURCE_GROUP `
  --name $DATABASE_NAME

# Create container with proper partition key
az cosmosdb sql container create `
  --account-name $COSMOS_ACCOUNT `
  --resource-group $RESOURCE_GROUP `
  --database-name $DATABASE_NAME `
  --name $CONTAINER_NAME `
  --partition-key-path "/userId"
```

---

## Step 2: Create Database and Container

If you created via Azure Portal, you still need to set up the database structure:

1. **Open your Cosmos DB account** in Azure Portal
2. **Data Explorer** → **New Database**
   - **Database ID**: `db_conversation_history`
   - Click **OK**
3. **New Container** (under your database):
   - **Database ID**: Select `db_conversation_history`
   - **Container ID**: `conversations`
   - **Partition key**: `/userId`
   - **Container throughput**: Database (if using provisioned) or leave blank (if serverless)
   - Click **OK**

---

## Step 3: Get Connection Information

### Option A: Get Primary Key (Simplest)

1. **Cosmos DB Account** → **Keys** (in left menu)
2. **Copy**:
   - **URI**: e.g., `https://datagaps-chat-history.documents.azure.com:443/`
   - **PRIMARY KEY**: Long string starting with letters and ending with `==`

### Option B: Use Managed Identity (Most Secure - Recommended)

Skip the key and use Azure AD authentication:

1. **Cosmos DB Account** → **Access Control (IAM)**
2. **Add role assignment**:
   - **Role**: `Cosmos DB Built-in Data Contributor`
   - **Assign access to**: Managed identity → App Service
   - **Select**: Your web app `38e7b35b-464c-5313-a1f5-cdd3925fd29b`
3. **Do NOT set** `AZURE_COSMOSDB_ACCOUNT_KEY` environment variable (it will use managed identity)

---

## Step 4: Configure Web App Environment Variables

Add these settings to your Azure App Service:

### Using Azure Portal:

1. **App Service** → **38e7b35b-464c-5313-a1f5-cdd3925fd29b**
2. **Configuration** → **Application settings** → **New application setting**
3. **Add each variable**:

```
AZURE_COSMOSDB_ACCOUNT = datagaps-chat-history
AZURE_COSMOSDB_DATABASE = db_conversation_history
AZURE_COSMOSDB_CONVERSATIONS_CONTAINER = conversations
AZURE_COSMOSDB_ENABLE_FEEDBACK = False
```

**Optional** (if NOT using managed identity):
```
AZURE_COSMOSDB_ACCOUNT_KEY = your-primary-key-here
```

4. **Save** → **Restart** app

### Using Azure CLI:

```powershell
$WEBAPP_NAME = "38e7b35b-464c-5313-a1f5-cdd3925fd29b"
$RESOURCE_GROUP = "EnterpriseAIWebChat"

az webapp config appsettings set `
  --name $WEBAPP_NAME `
  --resource-group $RESOURCE_GROUP `
  --settings `
    AZURE_COSMOSDB_ACCOUNT="datagaps-chat-history" `
    AZURE_COSMOSDB_DATABASE="db_conversation_history" `
    AZURE_COSMOSDB_CONVERSATIONS_CONTAINER="conversations" `
    AZURE_COSMOSDB_ENABLE_FEEDBACK="False"

# Restart app
az webapp restart --name $WEBAPP_NAME --resource-group $RESOURCE_GROUP
```

---

## Step 5: Verify Chat History Works

1. **Open your app**: https://38e7b35b-464c-5313-a1f5-cdd3925fd29b.azurewebsites.net
2. **Look for**: "Show chat history" button in the top-right corner
3. **Start a conversation**: Ask a few questions
4. **Click "Show chat history"**: You should see your conversation listed
5. **Refresh the page**: Your chat should still be there
6. **Click on a past conversation**: It should load the previous chat

---

## Troubleshooting

### History Button Not Showing

**Check 1**: Verify environment variables are set correctly
```powershell
az webapp config appsettings list `
  --name 38e7b35b-464c-5313-a1f5-cdd3925fd29b `
  --resource-group EnterpriseAIWebChat `
  --query "[?contains(name, 'COSMOS')].{Name:name, Value:value}" `
  --output table
```

**Check 2**: Check app logs for CosmosDB errors
```powershell
az webapp log tail `
  --name 38e7b35b-464c-5313-a1f5-cdd3925fd29b `
  --resource-group EnterpriseAIWebChat
```

### Authentication Errors

**Error**: "Unable to authenticate to Cosmos DB"

**Solution**: If using managed identity:
1. Verify role assignment (Step 3, Option B)
2. Wait 5-10 minutes for permissions to propagate
3. Restart web app

**Solution**: If using account key:
1. Verify key is correct (check for copy/paste errors)
2. Make sure there are no extra spaces or quotes
3. Key should end with `==`

### Connection Errors

**Error**: "Failed to initialize CosmosDB client"

**Check**:
1. Account name matches exactly (case-sensitive)
2. Database and container exist with correct names
3. Partition key is `/userId` (not `/id` or `/user`)
4. Firewall rules allow Azure services (Portal → Networking → Allow access from Azure Portal = Yes)

### Empty History

**If conversations aren't saving**:

1. Check browser console for errors (F12 → Console)
2. Verify user authentication is working (you should see your username in header)
3. Check CosmosDB container in Azure Portal → Data Explorer to see if documents exist

---

## Cost Estimation

### Serverless (Recommended)
- **First 1,000 RU/s**: Free tier
- **Storage**: $0.25/GB per month
- **Requests**: ~$0.30 per million requests
- **Estimated**: **$5-15/month** for typical usage (hundreds of chats)

### Provisioned Throughput
- **Minimum**: 400 RU/s = ~$24/month
- **Not recommended** unless you have thousands of users

---

## Optional: Enable Message Feedback

To allow users to rate AI responses (thumbs up/down):

```powershell
az webapp config appsettings set `
  --name 38e7b35b-464c-5313-a1f5-cdd3925fd29b `
  --resource-group EnterpriseAIWebChat `
  --settings AZURE_COSMOSDB_ENABLE_FEEDBACK="True"

az webapp restart `
  --name 38e7b35b-464c-5313-a1f5-cdd3925fd29b `
  --resource-group EnterpriseAIWebChat
```

Users will see thumbs up/down icons next to each AI response.

---

## Alternative: Browser-Only Storage (Not Recommended)

If you don't want to use CosmosDB, you could implement browser-local chat history, but:
- ❌ History only on one device/browser
- ❌ Lost if user clears browser data
- ❌ No multi-device sync
- ❌ No admin visibility

**Recommendation**: Use CosmosDB for enterprise deployments.

---

## Security Best Practices

1. **Use Managed Identity** instead of account keys when possible
2. **Enable firewall rules**: Restrict access to specific VNets/IPs
3. **Encryption**: Enabled by default (data encrypted at rest)
4. **Backup**: Enable periodic backups in Cosmos DB settings
5. **Monitor costs**: Set up budget alerts in Azure Cost Management

---

## Next Steps

After enabling chat history:
1. ✅ Test thoroughly with multiple conversations
2. ✅ Monitor CosmosDB usage in Azure Portal
3. ✅ Set up cost alerts
4. ✅ Consider enabling message feedback
5. ✅ Train users on chat history features

For questions or issues, check Azure CosmosDB documentation: https://learn.microsoft.com/azure/cosmos-db/
