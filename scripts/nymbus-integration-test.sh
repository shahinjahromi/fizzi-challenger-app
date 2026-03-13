#!/usr/bin/env bash
###############################################################################
# Nymbus Sandbox Integration Test Script
#
# 1. Creates two test customers on Nymbus sandbox
# 2. Opens checking + savings accounts for each
# 3. Tests an internal transfer (checking → savings) for customer 1
# 4. Tests an external transfer between customer 1 (Nymbus) and a
#    Fizzi demo user
###############################################################################
set -euo pipefail

NYMBUS="https://nymbus-sandbox-app.livelyforest-3ab8d97c.westus2.azurecontainerapps.io"
CLIENT_ID="sandbox_tenantshahin_e3b11199"
CLIENT_SECRET="bc1432c6e21b725de125c3dcda1e3ee7927d7fda70cde3c3"
FIZZI="http://localhost:4001"

# Colors
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; CYAN='\033[0;36m'; NC='\033[0m'

step()  { echo -e "\n${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"; echo -e "${YELLOW}▸ $1${NC}"; }
ok()    { echo -e "${GREEN}  ✔ $1${NC}"; }
info()  { echo -e "${CYAN}  ℹ $1${NC}"; }
warn()  { echo -e "${RED}  ⚠ $1${NC}"; }
json()  { python3 -m json.tool 2>/dev/null || echo "(raw response shown above)"; }

###############################################################################
step "1. Authenticate with Nymbus sandbox"
###############################################################################
TOKEN=$(curl -s -X POST "$NYMBUS/oauth/token" \
  -H "Content-Type: application/json" \
  -d "{\"client_id\":\"$CLIENT_ID\",\"client_secret\":\"$CLIENT_SECRET\",\"grant_type\":\"client_credentials\"}" \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")

[ -n "$TOKEN" ] && ok "Access token acquired (${TOKEN:0:12}…)" || { warn "Auth failed"; exit 1; }
AUTH="Authorization: Bearer $TOKEN"

###############################################################################
step "2. Create Test Customer 1 – Emily Nymbus"
###############################################################################
CUST1_RESP=$(curl -s -X POST "$NYMBUS/v1.1/customers" \
  -H "Content-Type: application/json" -H "$AUTH" \
  -d '{
    "first_name": "Emily",
    "last_name": "Nymbus",
    "email": "emily.nymbus@fizzibank.test",
    "date_of_birth": "1990-06-15",
    "ssn": "555123401"
  }')
echo "$CUST1_RESP" | json
CUST1_ID=$(echo "$CUST1_RESP" | python3 -c "
import sys,json; d=json.load(sys.stdin)
for k in ['id','customerId','customer_id']:
  v=d.get(k)
  if v: print(v); break
" 2>/dev/null || true)
[ -n "$CUST1_ID" ] && ok "Customer 1 created: $CUST1_ID" || info "Will use existing customer"

###############################################################################
step "3. Create Test Customer 2 – Marcus Nymbus"
###############################################################################
CUST2_RESP=$(curl -s -X POST "$NYMBUS/v1.1/customers" \
  -H "Content-Type: application/json" -H "$AUTH" \
  -d '{
    "first_name": "Marcus",
    "last_name": "Nymbus",
    "email": "marcus.nymbus@fizzibank.test",
    "date_of_birth": "1985-03-22",
    "ssn": "555123402"
  }')
echo "$CUST2_RESP" | json
CUST2_ID=$(echo "$CUST2_RESP" | python3 -c "
import sys,json; d=json.load(sys.stdin)
for k in ['id','customerId','customer_id']:
  v=d.get(k)
  if v: print(v); break
" 2>/dev/null || true)
[ -n "$CUST2_ID" ] && ok "Customer 2 created: $CUST2_ID" || info "Will use existing customer"

###############################################################################
step "4. List Nymbus customers (verify / fallback)"
###############################################################################
CUSTOMERS=$(curl -s "$NYMBUS/v1.0/customers?pageLimit=10" \
  -H "Content-Type: application/json" -H "$AUTH")
echo "$CUSTOMERS" | json

if [ -z "${CUST1_ID:-}" ]; then
  CUST1_ID=$(echo "$CUSTOMERS" | python3 -c "
import sys,json; d=json.load(sys.stdin)
items=d.get('data',d) if isinstance(d,dict) else d
if isinstance(items,list): print(items[0]['id'])
else: print(list(d.values())[0] if d else '')")
  ok "Fallback Customer 1: $CUST1_ID"
fi
if [ -z "${CUST2_ID:-}" ]; then
  CUST2_ID=$(echo "$CUSTOMERS" | python3 -c "
import sys,json; d=json.load(sys.stdin)
items=d.get('data',d) if isinstance(d,dict) else d
if isinstance(items,list) and len(items)>1: print(items[1]['id'])
elif isinstance(items,list) and len(items)>0: print(items[0]['id'])
else: print(list(d.values())[0] if d else '')")
  ok "Fallback Customer 2: $CUST2_ID"
fi

info "Customer 1: $CUST1_ID"
info "Customer 2: $CUST2_ID"

###############################################################################
step "5. Create Checking + Savings for Customer 1 ($CUST1_ID)"
###############################################################################
echo "  Creating Checking…"
A1C=$(curl -s -X POST "$NYMBUS/v1.0/customers/$CUST1_ID/accounts" \
  -H "Content-Type: application/json" -H "$AUTH" \
  -d '{"type":"checking","initial_deposit":5000}')
echo "$A1C" | json

echo "  Creating Savings…"
A1S=$(curl -s -X POST "$NYMBUS/v1.0/customers/$CUST1_ID/accounts" \
  -H "Content-Type: application/json" -H "$AUTH" \
  -d '{"type":"savings","initial_deposit":10000}')
echo "$A1S" | json

###############################################################################
step "6. Create Checking + Savings for Customer 2 ($CUST2_ID)"
###############################################################################
echo "  Creating Checking…"
A2C=$(curl -s -X POST "$NYMBUS/v1.0/customers/$CUST2_ID/accounts" \
  -H "Content-Type: application/json" -H "$AUTH" \
  -d '{"type":"checking","initial_deposit":3000}')
echo "$A2C" | json

echo "  Creating Savings…"
A2S=$(curl -s -X POST "$NYMBUS/v1.0/customers/$CUST2_ID/accounts" \
  -H "Content-Type: application/json" -H "$AUTH" \
  -d '{"type":"savings","initial_deposit":8000}')
echo "$A2S" | json

###############################################################################
step "7. List all accounts for both customers"
###############################################################################
echo "  Customer 1 ($CUST1_ID) accounts:"
ACCTS1=$(curl -s "$NYMBUS/v1.0/customers/$CUST1_ID/accounts?pageLimit=20" \
  -H "Content-Type: application/json" -H "$AUTH")
echo "$ACCTS1" | json

echo ""
echo "  Customer 2 ($CUST2_ID) accounts:"
ACCTS2=$(curl -s "$NYMBUS/v1.0/customers/$CUST2_ID/accounts?pageLimit=20" \
  -H "Content-Type: application/json" -H "$AUTH")
echo "$ACCTS2" | json

# Extract account IDs — handle both arrays and {data:[...]}
ACCT1_CHK=$(echo "$ACCTS1" | python3 -c "
import sys,json
d=json.load(sys.stdin)
items=d.get('data',d) if isinstance(d,dict) else d
for a in (items if isinstance(items,list) else []):
  t=a.get('type','').lower()
  if 'check' in t: print(a.get('id',a.get('account_id',''))); break
else:
  if isinstance(items,list) and len(items)>0: print(items[0].get('id',items[0].get('account_id','')))" 2>/dev/null || true)

ACCT1_SAV=$(echo "$ACCTS1" | python3 -c "
import sys,json
d=json.load(sys.stdin)
items=d.get('data',d) if isinstance(d,dict) else d
for a in (items if isinstance(items,list) else []):
  t=a.get('type','').lower()
  if 'sav' in t: print(a.get('id',a.get('account_id',''))); break
else:
  if isinstance(items,list) and len(items)>1: print(items[1].get('id',items[1].get('account_id','')))" 2>/dev/null || true)

ACCT2_CHK=$(echo "$ACCTS2" | python3 -c "
import sys,json
d=json.load(sys.stdin)
items=d.get('data',d) if isinstance(d,dict) else d
for a in (items if isinstance(items,list) else []):
  t=a.get('type','').lower()
  if 'check' in t: print(a.get('id',a.get('account_id',''))); break
else:
  if isinstance(items,list) and len(items)>0: print(items[0].get('id',items[0].get('account_id','')))" 2>/dev/null || true)

ok "Cust1 Checking: ${ACCT1_CHK:-N/A}"
ok "Cust1 Savings:  ${ACCT1_SAV:-N/A}"
ok "Cust2 Checking: ${ACCT2_CHK:-N/A}"

###############################################################################
step "8. INTERNAL TRANSFER – Cust1 Checking → Cust1 Savings (\$25.00)"
###############################################################################
if [ -n "${ACCT1_CHK:-}" ] && [ -n "${ACCT1_SAV:-}" ]; then
  IDEM1=$(python3 -c "import uuid; print(uuid.uuid4())")
  INT_XFER=$(curl -s -X POST "$NYMBUS/v1.1/transactions/transfer" \
    -H "Content-Type: application/json" -H "$AUTH" \
    -H "x-idempotency-key: $IDEM1" \
    -d "{
      \"from_account_id\": \"$ACCT1_CHK\",
      \"to_account_id\": \"$ACCT1_SAV\",
      \"amount\": 25.00,
      \"description\": \"Fizzi internal transfer test\"
    }")
  echo "$INT_XFER" | json
  ok "Internal transfer submitted"
else
  warn "Skipped – missing Cust1 account IDs"
fi

###############################################################################
step "9. Get Fizzi demo user info (for external transfer)"
###############################################################################
# Fizzi doesn't have a "list all accounts" endpoint;
# use a placeholder account/routing for the sandbox external-transfer test.
FIZZI_TOKEN=$(curl -s -X POST "$FIZZI/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"usernameOrEmail":"alice","password":"demo1234"}' | \
  python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('accessToken',d.get('token','')))" 2>/dev/null || true)

if [ -n "${FIZZI_TOKEN:-}" ]; then
  ok "Fizzi auth token acquired (confirms login works)"
else
  info "Fizzi auth unavailable – using placeholder"
fi

# Use Fizzi demo account info (from seed data)
FIZZI_ACCT_NUM="1000000001"
FIZZI_ROUTING="091000019"
ok "External destination account: $FIZZI_ACCT_NUM  routing: $FIZZI_ROUTING"

###############################################################################
step "10. EXTERNAL TRANSFER – Nymbus Cust1 Checking → Fizzi Alice (\$15.00)"
###############################################################################
if [ -n "${ACCT1_CHK:-}" ]; then
  IDEM2=$(python3 -c "import uuid; print(uuid.uuid4())")
  EXT_XFER=$(curl -s -X POST "$NYMBUS/v1.1/transactions/externalTransfer" \
    -H "Content-Type: application/json" -H "$AUTH" \
    -H "x-idempotency-key: $IDEM2" \
    -d "{
      \"from_account_id\": \"$ACCT1_CHK\",
      \"account_number\": \"$FIZZI_ACCT_NUM\",
      \"routing_number\": \"$FIZZI_ROUTING\",
      \"account_type\": \"checking\",
      \"amount\": 15.00,
      \"description\": \"Fizzi external transfer test\",
      \"recipient_name\": \"Alice Fizzi Demo\"
    }")
  echo "$EXT_XFER" | json
  ok "External transfer submitted"
else
  warn "Skipped – missing Cust1 checking account ID"
fi

###############################################################################
step "11. Verify – Account balances after transfers"
###############################################################################
echo "  Customer 1 accounts after transfers:"
curl -s "$NYMBUS/v1.0/customers/$CUST1_ID/accounts?pageLimit=20" \
  -H "Content-Type: application/json" -H "$AUTH" | json

###############################################################################
echo -e "\n${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  ✅ Nymbus Integration Test Complete${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "  Customer 1:  ${CYAN}${CUST1_ID:-N/A}${NC}"
echo -e "  Customer 2:  ${CYAN}${CUST2_ID:-N/A}${NC}"
echo -e "  Cust1 CHK:   ${CYAN}${ACCT1_CHK:-N/A}${NC}"
echo -e "  Cust1 SAV:   ${CYAN}${ACCT1_SAV:-N/A}${NC}"
echo -e "  Cust2 CHK:   ${CYAN}${ACCT2_CHK:-N/A}${NC}"
echo ""
