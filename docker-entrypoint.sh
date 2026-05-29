#!/bin/sh
set -e

# host.docker.internal может резолвиться в IPv6, недоступный из контейнера
LM_HOST=$(getent ahostsv4 host.docker.internal 2>/dev/null | awk 'NR==1 {print $1}')
if [ -n "$LM_HOST" ]; then
  LM_PORT="${LM_STUDIO_PORT:-1235}"
  export LM_STUDIO_URL="http://${LM_HOST}:${LM_PORT}"
fi

exec uvicorn app.main:app --host 0.0.0.0 --port 8000
