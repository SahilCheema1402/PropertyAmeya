#!/bin/bash
# Example of cleaning the target directory before copying the new build
echo "Cleaning up previous deployment..."
rm -rf /var/www/html/frontend/CRM/*
