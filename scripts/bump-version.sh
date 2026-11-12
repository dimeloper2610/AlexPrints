#!/bin/sh
# Updates the ?v= stamp on CSS/JS links so visitors get the new files after a deploy.
cd "$(dirname "$0")/.." && v=$(date +%Y%m%d%H%M) && sed -i '' -E "s/\?v=[0-9]+/?v=$v/g" *.html && echo "assets version $v"
