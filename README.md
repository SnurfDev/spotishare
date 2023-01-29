# Spotishare

Spotify listening party app i made because i was bored

## Installation
first download the repo or run
```sh
git clone https://github.com/Snurf08/spotishare.git
```
then create a application [here](https://developer.spotify.com/dashboard/applications).
Make sure to add `http://YOURLINK/setupcallback` and `http://localhost:8080/setupcallback` to the callback urls.
If your application is in Development mode (which it is by default) you need to paste the following code into devtools on the dashboard
```javascript
prompt("Heres your token",localStorage._sp_self_prov_accessToken) // paste the result into devmode_ownertkn
```
Then put your Spotify credentials and your devmode credentials in `credentials.json`

then run
```sh
npm install
```
## Running
```sh
npm start
```
