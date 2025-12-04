#!/bin/sh
PORT=${PORT:-3000}
exec serve -s dist -l $PORT

