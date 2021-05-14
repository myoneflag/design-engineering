from h2x-prod-web:latest

expose 80
env PORT 80

# PRODUCTION
env MODE production
cmd [ "npm", "run", "start-worker" ]
