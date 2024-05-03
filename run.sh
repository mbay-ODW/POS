#!/bin/bash

# Function to execute production commands
do_production() {
    cd /home/git/Production/POS
    docker-compose -p pos_prod down
    git pull
    docker-compose -p pos_prod up --build -d
}

do_testing() {
    cd /home/git/Testing/POS
    docker-compose -f docker-compose_testing.yml -p pos_testing down
    git pull
    docker-compose -f docker-compose_testing.yml -p pos_testing up --build -d
}

# Main script execution
case $1 in
    "production")
        do_production
        ;;
    "testing")
        do_testing
        ;;
    "")
        echo "Please specify a parameter: 'production' or 'testing'"
        ;;
    *)
        echo "Error: Invalid parameter. Please use 'production' or 'testing'."
        ;;
esac
