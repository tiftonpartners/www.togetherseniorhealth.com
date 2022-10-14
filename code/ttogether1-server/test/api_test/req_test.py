import requests

req = {
    "user": {
        "sid": 'h-' + '100515',
        "pidn": "",
        "firstName": "testFirstName",
        "lastName": "testLastName",
        "screenName": "newtestUserName",
        "email": "some@some.io",
        "primaryPhone": "1002003040",
        "mobilePhone": "1002003040",
        "courseInterest": "some",
        "program": "someTestProgram"
    }
}

url = 'https://mt1-api.dev.tsh.care/api/v1/hs/add_user'

api_key = 'snt3Ag+vX?8=8erbC-eQ'

resp = requests.post(url, json=req, headers={
    'api_key': api_key})

print(resp.status_code, resp.text)
