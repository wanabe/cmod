#!/bin/sh
set -e

docker build -t cmod:dev docker/
[ -z "$1" ] && set -- yarn dev
x11docker -m --share=$(pwd) --workdir=$(pwd) --sudouser --gpu --cap-default -- --security-opt seccomp=unconfined -- cmod:dev "$@"
