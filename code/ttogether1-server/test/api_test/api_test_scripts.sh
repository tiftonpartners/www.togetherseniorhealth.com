#!/bin/zsh

# local
curl -d @api_test_payload.json -H "api_key: snt3Ag+vX?8=8erbC-eQ" -H "CONTENT-TYPE: application/json" -X POST http://localhost:4000/api/v1/hs/add_user

# local
curl -H "api_key: snt3Ag+vX?8=8erbC-eQ" -H "CONTENT-TYPE: application/json" -X GET 'http://localhost:4000/api/v1/hs/upcoming_class_banner/TSH-Admin|6275721eeee2440004a0b907'

curl -H "api_key: snt3Ag+vX?8=8erbC-eQ" -H "CONTENT-TYPE: application/json" -X GET 'https://mt1-api.dev.tsh.care/api/v1/hs/upcoming_class_banner/TSH-Admin|627e83d23fa2b00004a7f520'

curl -H "api_key: snt3Ag+vX?8=8erbC-eQ" -H "CONTENT-TYPE: application/json" -X GET 'http://localhost:4000/api/v1/hs/upcoming_class_banner/TSH-Admin|627e83d23fa2b00004a7f520'

TSH-Admin%7C627e83d23fa2b00004a7f520

https://mt1-api.dev.tsh.care/api/v1/hs/upcoming_class_banner/TSH-Admin|62a764d0232fa80023324b4e


# DEV env
curl -d @api_test_payload.json -H "api_key: snt3Ag+vX?8=8erbC-eQ" -H "CONTENT-TYPE: application/json" -X POST https://mt1-api.dev.tsh.care/api/v1/hs/add_user
