# Build front
rm -Rf www/*
duo --use duo-hogan front/index.js > www/index.js
duo front/styles.css > www/styles.css
cp -f front/index.html www/index.html
cp -f front/favicon.ico www/favicon.ico
cp -fr front/js/ www/js/
cp -fr front/images/ www/images/

# Minify
mv www/index.js www/index.full.js
mv www/styles.css www/styles.full.css
minify www/index.full.js -o www/index.js
minify www/styles.full.css -o www/styles.css
rm -f www/index.full.js
rm -f www/styles.full.css