if [ -d "docs" ]; then
    rm -rf "docs" 
    mkdir "docs"
fi
export GITHUB_DEPLOY="darekf77"
export LIVE_BACKEND=true
export ENV="production"
cd preview
npm run build:prod
mv dist docs
mv docs ..
cd ..
echo "done !"