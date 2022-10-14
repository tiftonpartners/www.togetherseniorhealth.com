# This script must be run as ROOT on the linode server
echo -n "Session: $1 Ticket: $2"

HOST=mt1.test.tsh.care

	echo "https://${HOST}/stream/$1?ticket=$2"
	google-chrome "https://${HOST}/stream/$1?ticket=$2" \
		--no-sandbox \
		--use-fake-ui-for-media-stream \
		--use-fake-device-for-media-stream \
		--use-file-for-fake-video-capture=fakevideo.y4m \
		--use-file-for-fake-audio-capture=fakeaudio.wav \
		--autoplay-policy=no-user-gesture-required &

	sleep 10

echo "Streaming user started"
exit 1
