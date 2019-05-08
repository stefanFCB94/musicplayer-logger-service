docker-compose -f docker-compose.test.yml rm -f
docker-compose -f docker-compose.test.yml build
docker-compose -f docker-compose.test.yml up --timeout 1 --no-build -d

docker-compose -f docker-compose.test.yml run test npm test
exitCode=$?


docker-compose -f docker-compose.test.yml stop
docker-compose -f docker-compose.test.yml rm -f
exit "$exitCode"
