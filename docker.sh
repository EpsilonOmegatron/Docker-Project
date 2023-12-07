#!/bin/bash
docker network create private
docker build -t clinicapp BackEnd
docker build -t mysql Database
docker run -d --name=mysql -p  6603:3306 --network=private -v mysql:/var/lib/mysql mysql
sleep 25
docker run --name=clinicapp -p 8080:1234 --network=private --restart on-failure clinicapp