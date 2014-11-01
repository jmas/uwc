# Build front
duo --use duo-hogan front/index.js > www/index.js
duo front/styles.css > www/styles.css
cp -f front/index.html www/index.html