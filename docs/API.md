# Fylaro Finance - API Documentation

## Base URL
```
Production: https://api.fylaro.finance
Development: http://localhost:3001
```

## Authentication
All endpoints require Bearer token authentication:
```
Authorization: Bearer <your-jwt-token>
```

## Core Endpoints

### Invoice Management

#### Upload Invoice
```http
POST /api/invoices/upload
Content-Type: multipart/form-data

Body:
- file: Invoice PDF/Image
- metadata: JSON string with invoice details
```

#### Get Invoice Details
```http
GET /api/invoices/:invoiceId
```

#### List Invoices
```http
GET /api/invoices
Query Parameters:
- status: pending|approved|rejected
- page: 1
- limit: 20
```

### Tokenization

#### Tokenize Invoice
```http
POST /api/tokenization/create
Body: {
  "invoiceId": "string",
  "tokenAmount": number,
  "interestRate": number
}
```

### Investment

#### Invest in Token
```http
POST /api/investments/invest
Body: {
  "tokenId": "string",
  "amount": number
}
```

#### Get Portfolio
```http
GET /api/investments/portfolio
```

### Credit Scoring

#### Get Credit Score
```http
GET /api/credit/score/:companyId
```

## WebSocket Events

Connect to: `ws://localhost:3001` or `wss://api.fylaro.finance`

### Events
- `invoice:created` - New invoice uploaded
- `token:minted` - Invoice tokenized
- `investment:made` - New investment
- `price:update` - Real-time price changes

## Response Format

### Success Response
```json
{
  "success": true,
  "data": {},
  "message": "Operation successful"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

## Rate Limits
- 100 requests per minute per IP
- 1000 requests per hour per user

## Status Codes
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 404: Not Found
- 500: Server Error
