# Build front
rm -Rf www/*
duo --use duo-hogan front/index.js > www/index.js
duo front/styles.css > www/styles.css
cp -f front/index.html www/index.html
cp -f front/favicon.ico www/favicon.ico
cp -fr front/js/ www/js/
cp -fr front/images/ www/images/

# Minify
# minify www/index.js www/index.js
# minify www/styles.css www/styles.css

