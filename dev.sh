#!/bin/sh
set -e

if ! [ -f ~/.config/cmod/cmod.json ]; then
    mkdir -p ~/.config/cmod/
    cp cmod.json.example ~/.config/cmod/cmod.json
fi
which x11docker > /dev/null || {
    curl https://raw.githubusercontent.com/mviereck/x11docker/master/x11docker > $HOME/.local/bin/x11docker
    chmod a+x $HOME/.local/bin/x11docker
}
docker build -t cmod:dev docker/
[ -z "$1" ] && set -- yarn dev
x11docker -m --home=$HOME --share=$(pwd) --workdir=$(pwd) --sudouser --gpu --cap-default -- --security-opt seccomp=unconfined -- cmod:dev "$@"
