# .bashrc

# Source global definitions
if [ -f /etc/bashrc ]; then
	. /etc/bashrc
fi

# User specific environment
PATH="$HOME/.local/bin:$HOME/bin:$PATH"
export PATH

# Uncomment the following line if you don't like systemctl's auto-paging feature:
# export SYSTEMD_PAGER=

export DISPLAY=":1"

# User specific aliases and functions
alias vncports="ss -tulpn| grep vnc"
alias chrome="google-chrome https://together1.togetherseniorlife.com --use-fake-ui-for-media-stream --use-fake-device-for-media-stream --use-file-for-fake-audio-capture=./taunt.wav --use-file-for-fake-video-capture=example.y4m"
