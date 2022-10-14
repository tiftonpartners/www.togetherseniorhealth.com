# Welcome to TSH

Together Senior Health is an iPad app supporting portrait and landscape mode for iOS11+. It's using Flutter Agora Engine 3.2.1 and web socket.io 2.x.x

# Prerequisite

## Visual Code

I'm using Visual Studio Code 1.56.2

## Flutter SDK

Download the flutter SDK
 > git clone -b stable [_https://github.com/flutter/flutter.git_](https://github.com/flutter/flutter.git)

Downgrade it to 1.22.5 as we are not using Flutter v2
 > flutter downgrade v1.22.5

## Package dependencies

Some libraries had to be modified a little bit to make the websocket communication with the server works (around json-parse / socket.io). There are managed locally and not through pubspec.yaml.

Open the following file : 
> /packages/socket_io_client-0.9.12/packages/socket_io_common-0.9.2/pubspec.yaml

Click on install package button on top right or in the folder type
> flutter pub get

Open the following file : 
> /packages/socket_io_client-0.9.12/pubspec.yaml

Click on install package button on top right or in the folder type
> flutter pub get

Open the following file : 
> /pubspec.yaml

Click on install package button on top right or in the folder type
> flutter pub get

# Build

## Development
At the moment there was no certificate / provisioning profile created.

## Release

At the root of the project : 

> flutter build ios --release

Open with XCode the file 
> /ios/Runner.xcworkspace

Build an archive for uploading
> Product > Archive

Open the Organizer
> Window > Organizer

Upload the build for TestFlight
> Distribute App > App Store Connect > Upload

# Testflight

## Expose build for testing
The step before uploaded a build to the store. By connecting to 
https://appstoreconnect.apple.com/

Then go to 
> Apps >   
Together Senior Health > Testflight.

You will see your build. It can be in processing (usually take 10-15m') or will appear with a warning icons. it's because it requires a question to confirm if it's meeting compliances. Click on it and tick "No". It will make the build available for testing

## Create internal test users

https://appstoreconnect.apple.com/

Go to Users and Access. Click on the + button and add your email account. 

After the user accepted the invite, go to Apps >   
Together Senior Health > Testflight.
In the menu Internal Group > App store connect users > Testers. Add the new tester from the step above.

*It's possible to add a test user (ex: beta) without registering to Users and Access. Just send an invite through External Group*

