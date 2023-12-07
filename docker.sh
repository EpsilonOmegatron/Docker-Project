#!/bin/bash
docker network create private
docker build -t clinicapp BackEnd
docker build -t mysql Database
docker run -d --name=mysql -e MYSQL_ROOT_PASSWORD=1234 -p 6033:3306 --network=private -v mysql:/var/lib/mysql mysql
sleep 25
docker run -d --name=clinicapp -p 8080:1234 -e DB_HOST=mysql -e DB_USER=root -e DB_PASSWORD=1234 --network=private --restart on-failure clinicapp