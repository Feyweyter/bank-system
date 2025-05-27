# Banking Service System

A comprehensive banking service simulation built with TypeScript, Node.js, Express.js, Prisma, BullMQ and Redis.

## Features

- **Account Management**: Create accounts with initial deposits
- **Core Banking Operations**:
    - Deposits
    - Withdrawals (with overdraft protection)
    - Transfers between accounts
    - Balance inquiries
- **Transaction Processing**: Asynchronous transaction processing with BullMQ
- **Data Persistence**: SQLite database with Prisma ORM
- **Logging**: Logging with Winston
- **Error Handling**: Robust error handling with custom banking errors
- **Validation**: Input validation for all operations
- **Real-world Constraints**: Prevents overdrafts, validates amounts, etc.

## Installation

1. Install dependencies:
```bash
npm install
```

2. Set up the database:
```bash
npx prisma generate
npx prisma migrate dev --name init
```

3. Start Redis server (required for BullMQ):
```bash
redis-server
```


4. For development:
```bash
npm run dev
```

## API Endpoints

### Account Management
- `POST /api/accounts` - Create a new account
- `GET /api/accounts` - Get all accounts
- `GET /api/accounts/:accountId/balance` - Get account balance

### Transactions
- `POST /api/accounts/:accountId/deposit` - Deposit money
- `POST /api/accounts/:accountId/withdraw` - Withdraw money
- `POST /api/transfer` - Transfer between accounts

### Health Check
- `GET /health` - Service health status

## Example Usage

### Create Account
```bash
curl -X POST http://localhost:3000/api/accounts \
  -H "Content-Type: application/json" \
  -d '{"holderName": "John Doe", "initialDeposit": 1000.00}'
```

### Deposit Money
```bash
curl -X POST http://localhost:3000/api/accounts/{accountId}/deposit \
  -H "Content-Type: application/json" \
  -d '{"amount": 250.00}'
```

### Withdraw Money
```bash
curl -X POST http://localhost:3000/api/accounts/{accountId}/withdraw \
  -H "Content-Type: application/json" \
  -d '{"amount": 100.00}'
```

### Transfer Money
```bash
curl -X POST http://localhost:3000/api/transfer \
  -H "Content-Type: application/json" \
  -d '{"fromAccountId": "account1", "toAccountId": "account2", "amount": 200.00}'
```

### Check Balance
```bash
curl http://localhost:3000/api/accounts/{accountId}/balance