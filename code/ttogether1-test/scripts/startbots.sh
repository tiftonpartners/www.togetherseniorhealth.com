# This script must be run as ROOT on the linode server

if [ "$#" -ne 3 ]; then
  echo "Usage: $0 <env> <session> <server>" >&2
  echo "  Where <env> is 'dev', 'test', or 'prod' (prod is not set up yet)"
  echo "        <session> is a session acronym (e.g ROBOTATBOT1-220405)"
  echo "        <server> is Linode '1' or '2'"
  echo ""
  echo "You should run this script as ROOT"
  exit 1
fi

echo -n "Env: $1 Session: $2 "

case $1 in
	dev)
		HOST=mt1.dev.tsh.care
		if [[ $3 -eq "1" ]]
		then
			echo "Server: 1"
			read -r -d '' TKTS <<- EOM
			ovW1HoyrFfFt-0119o2JMvGDEHjmrW2i1tWsZgMkLe4-w-C_vzWoBFraKrmqC5l7
			y8GFdw9C7fhfrLeaLM21L96GqhKBgB3z6Jt785Nm7VccY2wF0lNtX5SUdk2okfKc
			LpeL8-k0TgN0uHWHXzR5p6gVIynjOhJ2ixwv1EUQYrdtLpBjM0grAzwMBYnWKcOx
			EOM
		else
			echo "Server: 2"
			read -r -d '' TKTS <<- EOM
			e86NpugfhF71VRABgDI_ycvQ1_47kNw2BhV_nC8K7Ndn0fonsyKVGuSwdShJ7L_k
			Yi07ayRlMIGnDckcWAYPG9TFOWftMFjBU_k3Q1tCesnFXYhMnimBzsIZqzL4zT90
			kSyner5zOBMa9yjdNvgbGou4QPN51SRnCFlwLrCjUz3OJ4ofhec8ZTZ_BMrBuymx
			EOM
		fi
		;;

	test)
		HOST=mt1.test.tsh.care
		if [[ $3 -eq "1" ]]
		then
			echo "Server: 1 with 4 bots - Squad 1, Bot 1, Squad 1, Bot 2, Squad 1, Bot 3, Squad 1, Bot 4"
			read -r -d '' TKTS <<- EOM
      vFNdeE5AFS6LLa_XV_niW5HPBabbf0xQ36Op9sA8MA1HjZLAAFI8RDCnQm6ydHKa
      4N_UySb5XoMJxHtBsg_saeTZ6OBJWkMCqwI8lA9A1yn4w9EzjmOOR0iYM7TbDCJ3
      oNtN2V8TNkT4-UuJf-jVzj8BpAJmCMa1IfObUJYitNznmhyeF_Apjjf31WFSV6Qw
      oyR91bdTJxVaYJQyQRo4dJVAQQ0bse4gXjbT0HoucEy2gfY32SPPYNOAzX0rFO9B
			EOM
		else
			echo "Server: 2 with 4 bots - Squad 1, Bot 5, Squad 1, Bot 6, Squad 1, Student 1, Squad 1, Student 2"
			read -r -d '' TKTS <<- EOM
			dFQilRgBFTYl3OFQxzUNTqs-RwImTSWj75MAy07dkZCJ6AVAo-LrktY9ytXjH-VJ
      FTLaNWyK09IOaNOFk4YI47SyYUa5ad2gHubKyMjyUtmGlStN0cBNR0g-L-aFf0Qa
      lRJMmo_BrgDGefW79kPYbx-DdQliLc9toOpCEGrm4P61KDNmYqKyDhTX5gAyBcdx
      bcWauO0EUCjvZbaALUEdXPTVe_TZPxEle4T9MGohlLwz-W0jvZAwBkoAI8-ePvAJ
			EOM
		fi
		;;

	prod)
		echo "Sorry, the bot army is not set up in PROD yet"
		exit 1

		HOST=mt1.togetherseniorhealth.com
		if [[ $3 -eq "1" ]]
		then
			echo "Server: 1"
			read -r -d '' TKTS <<- EOM
			EOM
		else
			echo "Server: 2"
			read -r -d '' TKTS <<- EOM
			EOM
		fi
		;;

	*)
	echo "[ERROR] Unknown environment:$1"
	exit 1
esac
echo "Testing against Host:$HOST"
i=1
for ticket in $TKTS
do
	echo "Starting:$i"
	echo "https://${HOST}/stream/$2?ticket=${ticket}"
	google-chrome "https://${HOST}/stream/$2?ticket=${ticket}" \
		--no-sandbox \
		--use-fake-ui-for-media-stream \
		--use-fake-device-for-media-stream \
		--use-file-for-fake-video-capture=fakevideo.y4m \
		--use-file-for-fake-audio-capture=fakeaudio.wav \
		--autoplay-policy=no-user-gesture-required \
		--new-window > startbots$i.out 2>&1 &


	sleep 10
	i=$((i+1))
done
echo "All streaming users started"
exit 1
