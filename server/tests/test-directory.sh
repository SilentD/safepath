BASE="http://localhost:3000/api"

curl -i "$BASE/health"

curl -i "$BASE/director"

#test by category

curl -i "$BASE/directory?category=SAPS"

curl -i "$BASE/directory?category=GBV%20Shelter"

curl -i "$BASE/directory?category=Legal%20Aid"

#test pagination
curl -i "$BASE/directory?page=1&limit=5"

#indivisual entry
read -r -p "Enter directory entry ID: " ENTRY_ID

curl -i "$BASE/directory/$ENTRY_ID"

#admin listing
curl -i -X GET "$BASE/directory/admin" \
  -H "Authorization: Bearer $ACCESS_TOKEN"

#admin test data entry
curl -i -X POST "$BASE/directory/" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "SafePath Test Support Centre",
    "phone": "0800000000",
    "address": "Test Street, Bloemfontein",
    "province": "Free State",
    "category": "Legal Aid",
    "verified": false,
    "active": true
  }'

#copy returned ID
read -r -p "Enter newly created entry ID: " ENTRY_ID

#Test update,verification and deactivation
curl -i -X PATCH "$BASE/directory/admin/$ENTRY_ID" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "0800000001",
    "address": "Updated Test Street, Bloemfontein"
  }'

curl -i -X PATCH "$BASE/directory/admin/$ENTRY_ID/verification" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"verified": true}'

#test visibility in public "BASE/directory"

#deactivation
curl -i -X DELETE "$BASE/directory/admin/$ENTRY_ID" \
  -H "Authorization: Bearer $ACCESS_TOKEN"

#check the indivisual entry,should not appear after this entry.
curl -i "$BASE/directory/$ENTRY_ID"

#unauthorized tests

curl -i -X POST "$BASE/directory/admin" \
  -H "Content-Type: application/json" \
  -d '{"name":"Unauthorized Test"}'

