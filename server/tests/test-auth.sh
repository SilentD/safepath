


BASE="http://localhost:3000/api/auth"

JAR="./safepath-test-cookies.txt"

#!/usr/bin/env bash
rm -f "$JAR"
touch "$JAR"
chmod 600 "$JAR"

#register
curl -sS -i -X POST "$BASE/signup" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "SafePath Test User",
    "email": "annamantjeane2009@gmail.com",
    "phoneNumber": "+27820000002",
    "password": "SafePathTest!2026"
  }'
#email verification
read -r -p "Email challenge ID: " CHALLENGE_ID
read -r -p "Email verification code: " VERIFY_CODE

curl -sS -i -X POST "$BASE/verify-email" \
  -H "Content-Type: application/json" \
  -d "{\"challengeId\":\"$CHALLENGE_ID\",\"code\":\"$VERIFY_CODE\"}"

  
#login
  curl -sS -i -c "$JAR" -b "$JAR" \
  -X POST "$BASE/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "communitylab.057@gmail.com",
    "password": "SafePathTest!2026"
  }'
#login 2fa challenge

read -r -p "Login challenge ID: " LOGIN_CHALLENGE_ID
read -r -p "Login 2FA code: " LOGIN_CODE

LOGIN_RESPONSE=$(curl -sS -c "$JAR" -b "$JAR" \
  -X POST "$BASE/verify-2fa" \
  -H "Content-Type: application/json" \
  -d "{\"challengeId\":\"$LOGIN_CHALLENGE_ID\",\"code\":\"$LOGIN_CODE\"}")

printf '%s\n' "$LOGIN_RESPONSE"

#extract and store access token

ACCESS_TOKEN=$(printf '%s' "$LOGIN_RESPONSE" | jq -er '.accessToken')

#test authenticated session

curl -sS -i -b "$JAR" \
  "$BASE/me" \
  -H "Authorization: Bearer $ACCESS_TOKEN"

#refresh session

REFRESH_RESPONSE=$(curl -sS -i -c "$JAR" -b "$JAR" \
  -X POST "$BASE/refresh" \
  -H "Content-Type: application/json" \
  -d '{}')

printf '%s\n' "$REFRESH_RESPONSE"

#extract new access token

ACCESS_TOKEN=$(printf '%s' "$REFRESH_RESPONSE" |
  sed '1,/^\r\{0,1\}$/d' |
  jq -er '.accessToken')

#logout
curl -sS -i -b "$JAR" -c "$JAR" \
  -X POST "$BASE/logout" \
  -H "Authorization: Bearer $NEW_TOKEN"

#test auth /me


