# Together Robot Army

This project has a simple script for starting clients ("the robot army") that stream canned video to a class session.

## Logging in and Remote Desktop Access
Currently, two Linux servers ("server 1" and "server 2") are used to execute up to three clients on each server. 
We use IP addresses to identify the servers, and SSH to login.  I usually setup the following aliases:

```
alias linode1='ssh -L 5901:localhost:5901 stevet@45.79.115.51'
alias linode2='ssh -L 5902:localhost:5901 stevet@172.104.216.92'
```

These commands also setup a port forward from the localhost to the VNC server of each remote server.  You can use your favorite VNC viewer to view the desktop of the server, connecting to the local port instead of the port on the server.  Here's an example of setting up the "VNC Viewer" app on the Mac:

![Alt text](img/vnc-viewer-setup.jpg?raw=true "VNC Viewer Setup, Server 1")

Simply use port 5902 for server two if you are using the port forwards I show in the aliases.

## Running Tests

ssh to the server of choice using your own login (and usually forwarding ports as above).  The server is running CentOS 8 with the GRUB desktop.  If you don't see
a directory named 'together-test', clone a copy of the repository using `git clone https://github.com/SteveTomasTSH/together1-test.git`

The clients are started by running the script `startbotsh.sh` (in folder `together1-test/scripts`):

```
[stevet@li1214-51 scripts]$ ./startbots.sh
Usage: ./startbots.sh <env> <session> <server>
  Where <env> is 'dev', 'test', or 'prod' (prod is not set up yet)
        <session> is a session acroynm
        <server> is '1' or '2'

```

For example:

```
[stevet@li1214-51 scripts]$  ./startbots.sh test MTROMTROBOTBOTS4-211206 1
```

This will start up three "bots" that start streaming to the session MTROBOTBOTS4-211206, for server 1.  You can see them streaming by opening the desktop for the server in VNC:

![Alt text](img/server-desktop.jpg?raw=true "VNC Viewer Showing Server Desktop")

NOTE:
> To avoid Agora streaming charges, it is important
> to disconnect all bots when testing is completed.

You can disconnect the bots using one of these techniques:
1. (safest) Restart the node from the linode manager (see below)
1. Close all of the browser windows from the VNC desktop
1. Use the "End Class" option as the instructor


![Alt text](img/linode-control.jpg?raw=true "Controling the Servers via Linode")







